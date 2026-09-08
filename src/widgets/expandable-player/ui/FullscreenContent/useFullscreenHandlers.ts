import { useAtom, useCtx } from '@reatom/npm-react'
import { useRef, useState } from 'react'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  downloadingAudioUrlAtom,
  downloadProgressAtom,
  durationAtom,
  isDownloadingAtom,
  positionAtom,
  useGuardedTogglePlay,
  usePlayer,
  useSeekControls,
} from 'entities/player'
import {
  cacheQueueAtom,
  cancelCacheDownload,
  enqueueCache,
  isCacheCancelledError,
  removeFromCache,
  resolveCacheState,
  useIsCached,
} from 'shared/lib/audio-cache'
import {
  cacheUpdateTriggerAtom,
  incrementCacheTrigger,
  markUrlEvicted,
} from 'shared/lib/cache-triggers'
import { isOnlineAtom } from 'shared/model'
import type BottomSheet from '@gorhom/bottom-sheet'
import { showMenuAtom } from '../../model/showMenuAtom'
import { showPlaylistAtom } from '../../model/showPlaylistAtom'

export const useFullscreenHandlers = () => {
  const ctx = useCtx()
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const [isOnline] = useAtom(isOnlineAtom)
  const [queue] = useAtom(cacheQueueAtom)
  const { seekTo } = usePlayer()
  const { togglePlay } = useGuardedTogglePlay()
  const { startSeek, stopSeek } = useSeekControls({ duration, position, seekTo })
  const [showMenu, setShowMenu] = useAtom(showMenuAtom)
  const [showPlaylist, setShowPlaylist] = useAtom(showPlaylistAtom)
  const [showDetails, setShowDetails] = useState(false)
  const playlistSheetRef = useRef<BottomSheet>(null)

  const isCached = useIsCached(audio?.audioUrl ?? null, cacheTrigger)
  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl
  const currentDownloadProgress = isCurrentAudioDownloading ? downloadProgress : 0
  const isQueued = audio?.audioUrl ? Object.hasOwn(queue, audio.audioUrl) : false
  const visualState = resolveCacheState({
    isCached,
    isDownloading: isCurrentAudioDownloading,
    isPlaying: false,
    isQueued,
  })

  const handleOpenPlaylist = () => {
    setShowPlaylist(true)
  }

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
    currentDownloadProgress,
    duration,
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
    showDetails,
    showMenu,
    showPlaylist,
    startSeek,
    stopSeek,
    visualState,
  }
}
