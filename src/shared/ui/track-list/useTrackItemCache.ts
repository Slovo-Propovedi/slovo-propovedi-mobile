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

export const useTrackItemCache = (
  audioUrl: null | string | undefined,
  downloadingUrl: null | string | undefined,
  externalCacheTrigger?: number,
) => {
  const ctx = useCtx()
  const [isOnline] = useAtom(isOnlineAtom)
  const internalCacheTriggerRef = useRef(0)
  const prevDownloadingUrlRef = useRef<null | string | undefined>(null)

  // Event-driven: increment cache trigger when download completes (transition from downloading to not downloading)
  // eslint-disable-next-line react-hooks/refs -- intentional: read ref during render to detect download completion transition
  const wasThisAudioDownloading = prevDownloadingUrlRef.current === audioUrl
  // eslint-disable-next-line react-hooks/refs -- intentional: detect download completion during render to trigger immediate cache re-check
  if (wasThisAudioDownloading && downloadingUrl === null) internalCacheTriggerRef.current += 1
  // eslint-disable-next-line react-hooks/refs -- intentional: track download state transition during render
  prevDownloadingUrlRef.current = downloadingUrl

  // eslint-disable-next-line react-hooks/refs -- intentional: read ref-trigger counter during render for cache key
  const internalCacheTrigger = internalCacheTriggerRef.current
  const isCached = useIsCached(audioUrl ?? null, internalCacheTrigger + (externalCacheTrigger ?? 0))

  // Narrow subscription: manual ctx.subscribe + useState bailout (Object.is) so a
  // progress tick re-renders ONLY the track whose url changed, not every list item.
  // NOTE: useAtom(computedFn, deps) overload crashes with installed core@1001.3.0.
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
  const isDownloading = effectiveProgress >= 0 && effectiveProgress < 1

  // Queue subscription: track whether this URL is queued (not yet downloading).
  // The queue entry is removed by the runner when its download starts, so the
  // clock disappears and the progress bar takes over reactively.
  const [isQueued, setIsQueued] = useState(false)
  useEffect(() => {
    const url = audioUrl ?? null
    const readQueued = () => {
      const queued = url ? url in ctx.get(cacheQueueAtom) : false
      setIsQueued(prev => (prev === queued ? prev : queued))
    }
    readQueued()
    if (!url) return
    return ctx.subscribe(cacheQueueAtom, readQueued)
  }, [ctx, audioUrl])

  const toggleCache = async () => {
    if (!audioUrl) return

    // Cancel: active download or queued — cancel unconditionally
    if (isDownloading || isQueued) {
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
  const isCacheDisabled = !isOnline && !isCached && !isDownloading && !isQueued

  const stateInput: ResolveCacheStateInput = {
    isCached,
    isDownloading,
    isPlaying: false,
    isQueued,
  }
  const visualState: TrackCacheVisualState = resolveCacheState(stateInput)

  return {
    isCached,
    isCacheDisabled,
    isDownloading,
    isQueued,
    progressValue: effectiveProgress,
    toggleCache,
    visualState,
  }
}
