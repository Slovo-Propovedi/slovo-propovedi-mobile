import type { ControlsNames } from './PlayerControls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import type { AudioPlayerData, PlaylistData } from 'shared/model'
import { useGuardedTogglePlay } from '../../lib/useGuardedTogglePlay'
import { usePlayer } from '../../lib/usePlayer'
import { usePlayerState } from '../../lib/usePlayerState'
import { FullscreenControls } from '../FullscreenControls'
import { DefaultControls } from './DefaultControls'
import { PlayerControlsSize } from './PlayerControls.types'
import { useAppStatePlayback } from './useAppStatePlayback'
import { usePlayerControlSizes } from './usePlayerControlSizes'
import { usePlayerToggleTrack } from './usePlayerToggleTrack'
import { usePlayerTrackState } from './usePlayerTrackState'

interface PlayerControlsProps {
  currentAudio: AudioPlayerData | null
  currentPlaylist: null | PlaylistData
  excludeButtons?: ControlsNames[]
  onLongPressSeek?: (direction: 'backward' | 'forward') => void
  onPressOutSeek?: () => void
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  size?: PlayerControlsSize
  style?: StyleProp<ViewStyle>
  variant?: PlayerControlsVariant
}

type PlayerControlsVariant = 'default' | 'fullscreen'

export const PlayerControls = ({
  currentAudio,
  currentPlaylist,
  excludeButtons,
  onLongPressSeek,
  onPressOutSeek,
  setCurrentAudio,
  size = PlayerControlsSize.Large,
  style,
  variant = 'default',
}: PlayerControlsProps) => {
  const {
    getStatus,
    play,
    reassertLockScreenMetadata,
    replaceAudio,
    seekTo,
    setLockScreenMetadata,
  } = usePlayer()

  const { isBuffering, isPlaying } = usePlayerState()

  const { togglePlay } = useGuardedTogglePlay()

  useAppStatePlayback({ currentAudio, currentPlaylist, getStatus, reassertLockScreenMetadata })

  const { hasValidPlaylist, index } = usePlayerTrackState({
    currentAudio,
    currentPlaylist,
  })

  const { buttonSize, isFullscreen, playButtonSize } = usePlayerControlSizes({
    size,
    variant,
  })

  const toggleTrack = usePlayerToggleTrack({
    currentPlaylist,
    hasValidPlaylist,
    index,
    play,
    replaceAudio,
    seekTo,
    setCurrentAudio,
    setLockScreenMetadata,
  })

  // Issue #67: кнопки не отключаем на границах плейлиста — long-press перемотка
  // должна работать всегда; тап на границе — безопасный no-op (guard в usePlayerToggleTrack).
  const isTrackButtonDisabled = !currentAudio

  const renderFullscreenControls = () => (
    <FullscreenControls
      style={style}
      isPlaying={isPlaying}
      buttonSize={buttonSize}
      togglePlay={togglePlay}
      isBuffering={isBuffering}
      toggleTrack={toggleTrack}
      excludeButtons={excludeButtons}
      onPressOutSeek={onPressOutSeek}
      playButtonSize={playButtonSize}
      onLongPressSeek={onLongPressSeek}
      isTrackButtonDisabled={isTrackButtonDisabled}
    />
  )

  const renderDefaultControls = () => (
    <DefaultControls
      size={size}
      style={style}
      isPlaying={isPlaying}
      togglePlay={togglePlay}
      isBuffering={isBuffering}
      toggleTrack={toggleTrack}
      excludeButtons={excludeButtons}
      hasCurrentAudio={!!currentAudio}
      isTrackButtonDisabled={isTrackButtonDisabled}
    />
  )

  if (isFullscreen) return renderFullscreenControls()

  return renderDefaultControls()
}
