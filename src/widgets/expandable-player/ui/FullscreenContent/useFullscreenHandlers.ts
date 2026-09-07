import { useAtom } from '@reatom/npm-react'
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
import { cacheAudio, removeFromCache, useIsCached } from 'shared/lib/audio-cache'
import type BottomSheet from '@gorhom/bottom-sheet'
import { showMenuAtom } from '../../model/showMenuAtom'
import { showPlaylistAtom } from '../../model/showPlaylistAtom'

export const useFullscreenHandlers = () => {
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)
  const { seekTo } = usePlayer()
  const { togglePlay } = useGuardedTogglePlay()
  const { startSeek, stopSeek } = useSeekControls({ duration, position, seekTo })
  const [showMenu, setShowMenu] = useAtom(showMenuAtom)
  const [showPlaylist, setShowPlaylist] = useAtom(showPlaylistAtom)
  const [showDetails, setShowDetails] = useState(false)
  const playlistSheetRef = useRef<BottomSheet>(null)

  const isCached = useIsCached(audio?.audioUrl ?? null)
  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl
  const currentDownloadProgress = isCurrentAudioDownloading ? downloadProgress : 0

  const handleOpenPlaylist = () => {
    setShowPlaylist(true)
  }

  const handleToggleCache = async () => {
    if (!audio?.audioUrl) return
    try {
      if (isCached) await removeFromCache(audio.audioUrl)
      else await cacheAudio(audio.audioUrl)
    } catch (error) {
      console.warn('[FullscreenContent] Error toggling cache:', error)
    }
  }

  return {
    audio,
    currentDownloadProgress,
    duration,
    handleOpenPlaylist,
    handleToggleCache,
    handleTogglePlay: togglePlay,
    isCached,
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
  }
}
