import { useAtom, useCtx } from '@reatom/npm-react'
import { useRef } from 'react'
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
import {
  currentAudioAtom,
  currentPlaylistAtom,
  downloadingAudioUrlAtom,
  durationAtom,
  isDownloadingAtom,
  positionAtom,
  useGuardedTogglePlay,
  usePlayer,
  useSeekControls,
} from 'entities/player'
import { isOnlineAtom } from 'shared/model'
import type BottomSheet from '@gorhom/bottom-sheet'
import { getFullscreenVisualState } from '../../lib/getFullscreenVisualState'
import { useCollapseCascade } from './useCollapseCascade'

export const useFullscreenHandlers = () => {
  const ctx = useCtx()
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const [isOnline] = useAtom(isOnlineAtom)
  const [queue] = useAtom(cacheQueueAtom)
  const { seekTo } = usePlayer()
  const { togglePlay } = useGuardedTogglePlay()
  const { startSeek, stopSeek, tapSeek } = useSeekControls({ duration, position, seekTo })
  const {
    handleCollapse,
    setShowDetails,
    setShowMenu,
    setShowPlaylist,
    setShowSoundSettings,
    showDetails,
    showMenu,
    showPlaylist,
    showSoundSettings,
  } = useCollapseCascade()
  const playlistSheetRef = useRef<BottomSheet>(null)

  const isCached = useIsCached(audio?.audioUrl ?? null, cacheTrigger)
  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl
  const isQueued = audio?.audioUrl ? Object.hasOwn(queue, audio.audioUrl) : false
  const visualState = getFullscreenVisualState({
    isCached,
    isCurrentAudioDownloading,
    isQueued,
  })

  const handleOpenPlaylist = () => setShowPlaylist(true)

  const handleToggleCache = async () => {
    if (!audio?.audioUrl) return

    if (isCurrentAudioDownloading || isQueued) {
      cancelCacheDownload(ctx, audio.audioUrl)
      return
    }

    if (isCached) {
      try {
        await removeFromCache(audio.audioUrl)
        markUrlEvicted(ctx, audio.audioUrl)
        incrementCacheTrigger(ctx)
      } catch (error) {
        console.warn('[FullscreenContent] Error removing from cache:', error)
      }
      return
    }

    if (!isOnline) return
    void enqueueCache(ctx, audio.audioUrl, 'manual')
      .then(() => {
        incrementCacheTrigger(ctx)
      })
      .catch(error => {
        if (!isCacheCancelledError(error))
          console.warn('[FullscreenContent] Error enqueuing cache:', error)
      })
  }

  return {
    audio,
    duration,
    handleCollapse,
    handleOpenPlaylist,
    handleToggleCache,
    handleTogglePlay: togglePlay,
    isCached,
    isQueued,
    playlist,
    playlistSheetRef,
    position,
    seekTo,
    setShowDetails,
    setShowMenu,
    setShowPlaylist,
    setShowSoundSettings,
    showDetails,
    showMenu,
    showPlaylist,
    showSoundSettings,
    startSeek,
    stopSeek,
    tapSeek,
    visualState,
  }
}
