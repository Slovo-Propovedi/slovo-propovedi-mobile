import { useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import { cacheAudio, removeFromCache, useIsCached } from 'shared/lib/audio-cache'
import { cacheUpdateTriggerAtom, playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'

export const useTrackItemCache = (
  audioUrl: null | string | undefined,
  downloadingUrl: null | string | undefined,
  externalCacheTrigger?: number,
) => {
  const ctx = useCtx()
  const [internalCacheTrigger, setInternalCacheTrigger] = useState(0)
  const prevDownloadingUrlRef = useRef<null | string | undefined>(null)
  const isCached = useIsCached(audioUrl ?? null, internalCacheTrigger + (externalCacheTrigger ?? 0))
  const progressValue = useAtom(playlistDownloadProgressAtom)[0][audioUrl ?? ''] ?? -1
  const isDownloading = progressValue >= 0 && progressValue < 1

  useEffect(() => {
    const wasThisAudioDownloading = prevDownloadingUrlRef.current === audioUrl

    if (wasThisAudioDownloading && downloadingUrl === null)
      setInternalCacheTrigger(prev => prev + 1)

    prevDownloadingUrlRef.current = downloadingUrl
  }, [downloadingUrl, audioUrl])

  const toggleCache = async () => {
    if (!audioUrl) return
    try {
      isCached ? await removeFromCache(audioUrl) : await cacheAudio(audioUrl)
      setInternalCacheTrigger(prev => prev + 1)
      cacheUpdateTriggerAtom(ctx, prev => prev + 1)
    } catch (error) {
      console.warn('[useTrackItemCache] Error toggling cache:', error)
    }
  }

  return {
    isCached,
    isDownloading,
    progressValue,
    toggleCache,
  }
}
