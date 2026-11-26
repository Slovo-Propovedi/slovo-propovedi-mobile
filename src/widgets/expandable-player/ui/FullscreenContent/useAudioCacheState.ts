import { useAtom, useCtx } from '@reatom/npm-react'
import {
  cacheQueueAtom,
  cacheUpdateTriggerAtom,
  cancelCacheDownload,
  enqueueCache,
  incrementCacheTrigger,
  isCacheCancelledError,
  markUrlEvicted,
  removeFromCache,
  useIsCached,
} from 'entities/offline-cache'
import { downloadingAudioUrlAtom, isDownloadingAtom } from 'entities/player'
import { isOnlineAtom } from 'shared/model'
import { getFullscreenVisualState } from '../../lib/getFullscreenVisualState'

/**
 * Кэш-состояние трека в плеере и ручное переключение «офлайн»: `isCached`,
 * `isQueued` и `visualState` для строки меню плюс обработчик
 * постановки/отмены/удаления из кэша.
 * @param audioUrl - Url текущего трека; `undefined` отключает переключение.
 */
export const useAudioCacheState = (audioUrl: string | undefined) => {
  const ctx = useCtx()
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const [isOnline] = useAtom(isOnlineAtom)
  const [queue] = useAtom(cacheQueueAtom)

  const isCached = useIsCached(audioUrl ?? null, cacheTrigger)
  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audioUrl
  const isQueued = audioUrl ? Object.hasOwn(queue, audioUrl) : false
  const visualState = getFullscreenVisualState({ isCached, isCurrentAudioDownloading, isQueued })

  const handleToggleCache = async () => {
    if (!audioUrl) return

    if (isCurrentAudioDownloading || isQueued) {
      cancelCacheDownload(ctx, audioUrl)
      return
    }

    if (isCached) {
      try {
        await removeFromCache(audioUrl)
        markUrlEvicted(ctx, audioUrl)
        incrementCacheTrigger(ctx)
      } catch (error) {
        console.warn('[useAudioCacheState] Error removing from cache:', error)
      }
      return
    }

    if (!isOnline) return
    void enqueueCache(ctx, audioUrl, 'manual')
      .then(() => {
        incrementCacheTrigger(ctx)
      })
      .catch(error => {
        if (!isCacheCancelledError(error))
          console.warn('[useAudioCacheState] Error enqueuing cache:', error)
      })
  }

  return { handleToggleCache, isCached, isQueued, visualState }
}
