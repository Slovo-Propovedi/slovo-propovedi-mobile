import { useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import {
  cacheQueueAtom,
  cancelCacheDownload,
  enqueueCache,
  isCacheCancelledError,
  removeFromCache,
  resolveCacheState,
  type ResolveCacheStateInput,
  type TrackCacheVisualState,
} from '../../lib/audio-cache'
import { useIsCached } from '../../lib/audio-cache/useIsCached'
import {
  incrementCacheTrigger,
  markUrlEvicted,
  playlistDownloadProgressAtom,
} from '../../lib/cache-triggers'
import { isOnlineAtom } from '../../model/network'

/**
 * Owns the per-row cache/download state of a track: cached/queued/downloading
 * (from the shared per-URL queue and progress atoms) plus the offline toggle.
 * @param audioUrl - Track audio URL; falsy URLs resolve to the idle state.
 * @param externalCacheTrigger - Extra trigger such as batch caching that forces a cache re-check.
 */
export const useTrackItemCache = (
  audioUrl: null | string | undefined,
  externalCacheTrigger?: number,
) => {
  const ctx = useCtx()
  const [isOnline] = useAtom(isOnlineAtom)
  const internalCacheTriggerRef = useRef(0)
  const prevIsDownloadingRef = useRef(false)

  // Narrow per-URL progress subscription (Object.is bailout keeps unrelated rows from re-rendering).
  const [progressValue, setProgressValue] = useState(-1)
  useEffect(() => {
    if (!audioUrl) return
    const readProgress = () => {
      const next = ctx.get(playlistDownloadProgressAtom)[audioUrl] ?? -1
      setProgressValue(prev => (prev === next ? prev : next))
    }
    readProgress()
    return ctx.subscribe(playlistDownloadProgressAtom, readProgress)
  }, [ctx, audioUrl])
  const effectiveProgress = audioUrl ? progressValue : -1
  const isDownloadingByProgress = effectiveProgress >= 0 && effectiveProgress < 1

  // eslint-disable-next-line react-hooks/refs -- intentional: read ref during render to detect download completion transition
  const wasThisAudioDownloading = prevIsDownloadingRef.current
  // eslint-disable-next-line react-hooks/refs -- intentional: detect download completion during render to trigger immediate cache re-check
  if (wasThisAudioDownloading && !isDownloadingByProgress) internalCacheTriggerRef.current += 1
  // eslint-disable-next-line react-hooks/refs -- intentional: track download state transition during render
  prevIsDownloadingRef.current = isDownloadingByProgress

  // eslint-disable-next-line react-hooks/refs -- intentional: read ref-trigger counter during render for cache key
  const internalCacheTrigger = internalCacheTriggerRef.current
  const isCached = useIsCached(audioUrl ?? null, internalCacheTrigger + (externalCacheTrigger ?? 0))

  // Queue subscription: the clock disappears when the runner starts the download.
  const [isQueued, setIsQueued] = useState(false)
  useEffect(() => {
    const url = audioUrl ?? null
    const readQueued = () => {
      const queued = url ? Object.hasOwn(ctx.get(cacheQueueAtom), url) : false
      setIsQueued(prev => (prev === queued ? prev : queued))
    }
    readQueued()
    if (!url) return
    return ctx.subscribe(cacheQueueAtom, readQueued)
  }, [ctx, audioUrl])

  const toggleCache = async () => {
    if (!audioUrl) return

    // Cancel: active download or queued — cancel unconditionally
    if (isDownloadingByProgress || isQueued) {
      cancelCacheDownload(ctx, audioUrl)
      return
    }

    // Remove from cache
    if (isCached) {
      try {
        await removeFromCache(audioUrl)
        markUrlEvicted(ctx, audioUrl)
        internalCacheTriggerRef.current += 1
        incrementCacheTrigger(ctx)
      } catch (error) {
        console.warn('[useTrackItemCache] Error removing from cache:', error)
      }
      return
    }

    // Cloud → enqueue (don't block on download)
    if (!isOnline) return
    void enqueueCache(ctx, audioUrl, 'manual')
      .then(() => {
        internalCacheTriggerRef.current += 1
        incrementCacheTrigger(ctx)
      })
      .catch(error => {
        if (!isCacheCancelledError(error))
          console.warn('[useTrackItemCache] Error enqueuing cache:', error)
      })
  }

  // isCacheDisabled: stop/remove-from-queue items must be ENABLED;
  // only disable the cloud branch (starting a download while offline)
  const isCacheDisabled = !isOnline && !isCached && !isDownloadingByProgress && !isQueued

  const stateInput: ResolveCacheStateInput = {
    isCached,
    isDownloading: isDownloadingByProgress,
    isPlaying: false,
    isQueued,
  }
  const visualState: TrackCacheVisualState = resolveCacheState(stateInput)

  return {
    isCached,
    isCacheDisabled,
    isDownloading: isDownloadingByProgress,
    isQueued,
    progressValue: effectiveProgress,
    toggleCache,
    visualState,
  }
}
