import { useCtx } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import { cacheAudio, removeFromCache } from '../../lib/audio-cache/AudioCacheService'
import { useIsCached } from '../../lib/audio-cache/useIsCached'
import { cacheUpdateTriggerAtom, playlistDownloadProgressAtom } from '../../lib/cache-triggers'

export const useTrackItemCache = (
  audioUrl: null | string | undefined,
  downloadingUrl: null | string | undefined,
  externalCacheTrigger?: number,
) => {
  const ctx = useCtx()
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

  const toggleCache = async () => {
    if (!audioUrl) return
    try {
      isCached ? await removeFromCache(audioUrl) : await cacheAudio(audioUrl)
      internalCacheTriggerRef.current += 1
      cacheUpdateTriggerAtom(ctx, prev => prev + 1)
    } catch (error) {
      console.warn('[useTrackItemCache] Error toggling cache:', error)
    }
  }

  return { isCached, isDownloading, progressValue: effectiveProgress, toggleCache }
}
