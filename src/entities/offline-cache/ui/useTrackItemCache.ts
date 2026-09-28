import { useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import { isOnlineAtom } from 'shared/model'
import { cacheQueueAtom } from '../lib/cacheQueueState'
import {
  resolveCacheState,
  type ResolveCacheStateInput,
  type TrackCacheVisualState,
} from '../lib/resolveCacheState'
import { sermonCachingEnabledAtom } from '../lib/sermonCachingSetting'
import { toggleTrackCache } from '../lib/toggleTrackCache'
import { useIsCached } from '../lib/useIsCached'
import { incrementCacheTrigger, playlistDownloadProgressAtom } from '../model'

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
  const [isSermonCachingEnabled] = useAtom(sermonCachingEnabledAtom)
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

  const handleCacheChanged = () => {
    internalCacheTriggerRef.current += 1
    incrementCacheTrigger(ctx)
  }

  const toggleCache = () =>
    toggleTrackCache({
      audioUrl,
      ctx,
      isCached,
      isDownloading: isDownloadingByProgress,
      isOnline,
      isQueued,
      isSermonCachingEnabled,
      onCacheChanged: handleCacheChanged,
    })

  // isCacheDisabled: stop/remove-from-queue items must be ENABLED; only the
  // cloud branch (starting a download while offline) is disabled. Caching off
  // in settings disables every branch — the row must not offer a download the
  // queue would refuse anyway.
  const isCacheDisabled =
    !isSermonCachingEnabled || (!isOnline && !isCached && !isDownloadingByProgress && !isQueued)

  const stateInput: ResolveCacheStateInput = {
    isCached,
    isDownloading: isDownloadingByProgress,
    isPlaying: false,
    isQueued,
  }
  // Caching off: no cached/downloading/queued indicator survives the row.
  const visualState: TrackCacheVisualState = isSermonCachingEnabled
    ? resolveCacheState(stateInput)
    : 'cloud'

  return {
    isCached,
    isCacheDisabled,
    isDownloading: isDownloadingByProgress,
    isQueued,
    isSermonCachingEnabled,
    progressValue: effectiveProgress,
    toggleCache,
    visualState,
  }
}
