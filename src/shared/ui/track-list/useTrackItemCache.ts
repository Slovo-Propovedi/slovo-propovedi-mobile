import { useAtom, useCtx } from '@reatom/npm-react'
import { useRef } from 'react'
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
  const progressValue = useAtom(playlistDownloadProgressAtom)[0][audioUrl ?? ''] ?? -1
  const isDownloading = progressValue >= 0 && progressValue < 1

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

  return { isCached, isDownloading, progressValue, toggleCache }
}
