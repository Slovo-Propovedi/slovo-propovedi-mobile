import { useAtom } from '@reatom/npm-react'
import { useRef } from 'react'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  durationAtom,
  positionAtom,
  useGuardedTogglePlay,
  usePlayer,
  useSeekControls,
} from 'entities/player'
import type BottomSheet from '@gorhom/bottom-sheet'
import { useAudioCacheState } from './useAudioCacheState'
import { useCollapseCascade } from './useCollapseCascade'
import { useFullscreenTourActions } from './useFullscreenTourActions'

export const useFullscreenHandlers = () => {
  const [audio] = useAtom(currentAudioAtom)
  const [duration] = useAtom(durationAtom)
  const [position] = useAtom(positionAtom)
  const [playlist] = useAtom(currentPlaylistAtom)
  const { seekTo } = usePlayer()
  const { togglePlay } = useGuardedTogglePlay()
  const { startSeek, stopSeek, tapSeek } = useSeekControls({ duration, position, seekTo })
  const {
    handleCollapse,
    setMenuView,
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

  useFullscreenTourActions({ setMenuView, setShowDetails, setShowMenu, setShowSoundSettings })

  const { handleToggleCache, isCached, isQueued, visualState } = useAudioCacheState(audio?.audioUrl)

  const handleOpenPlaylist = () => setShowPlaylist(true)

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
