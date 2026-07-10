import { useAction, useAtom } from '@reatom/npm-react'
import { useRef, useState } from 'react'
import {
  type AudioPlayerData,
  currentAudioAtom,
  currentPlaylistAtom,
  downloadingAudioUrlAtom,
  downloadProgressAtom,
  durationAtom,
  isDownloadingAtom,
  isPlayingAtom,
  positionAtom,
  setCurrentAudioAction,
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
  const [isPlaying] = useAtom(isPlayingAtom)
  const [isDownloading] = useAtom(isDownloadingAtom)
  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)
  const { loadAudio, pause, play, seekTo } = usePlayer()
  const { startSeek, stopSeek } = useSeekControls({ duration, position, seekTo })
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const [showMenu, setShowMenu] = useAtom(showMenuAtom)
  const [showPlaylist, setShowPlaylist] = useAtom(showPlaylistAtom)
  const [showDescription, setShowDescription] = useState(false)
  const playlistSheetRef = useRef<BottomSheet>(null)

  const isCached = useIsCached(audio?.audioUrl ?? null)
  const isCurrentAudioDownloading = isDownloading && downloadingAudioUrl === audio?.audioUrl
  const currentDownloadProgress = isCurrentAudioDownloading ? downloadProgress : 0

  const handleTogglePlay = async () => {
    if (isPlaying) await pause()
    else await play()
  }

  const handleOpenPlaylist = () => {
    setShowPlaylist(true)
    setTimeout(() => playlistSheetRef.current?.expand(), 0)
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

  const handleNextSermon = async () => {
    if (!playlist) return
    const playlistList = playlist.sermons
    const currentIndex = playlistList.findIndex(t => t.id === audio?.id)
    if (currentIndex < 0) return
    const track = playlistList[currentIndex + 1]
    if (!track?.audioUrl || !track.id) return
    const { audioUrl, ...rest } = track
    const newAudio: AudioPlayerData = {
      ...rest,
      artwork: playlist.artwork,
      audioUrl,
      id: track.id,
      title: track.title,
    }
    await setCurrentAudio(newAudio)
    await loadAudio(newAudio.audioUrl)
    await play()
  }

  return {
    audio,
    currentDownloadProgress,
    duration,
    handleNextSermon,
    handleOpenPlaylist,
    handleToggleCache,
    handleTogglePlay,
    isCached,
    playlist,
    playlistSheetRef,
    position,
    seekTo,
    setShowDescription,
    setShowMenu,
    setShowPlaylist,
    showDescription,
    showMenu,
    showPlaylist,
    startSeek,
    stopSeek,
  }
}
