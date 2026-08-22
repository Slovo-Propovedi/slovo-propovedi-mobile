import { reportError } from 'shared/model/error-dialog'
import type { AudioPlayerData, ControlsNames } from './PlayerControls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import type { PlaylistData } from 'shared/model'
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
  const { getStatus, pause, play, replaceAudio, setLockScreenMetadata } = usePlayer()

  const { isBuffering, isPlaying } = usePlayerState()

  useAppStatePlayback({ currentAudio, currentPlaylist, getStatus, setLockScreenMetadata })

  const { hasValidPlaylist, index, isFirstTrack, isLastTrack } = usePlayerTrackState({
    currentAudio,
    currentPlaylist,
  })

  const { buttonSize, isFullscreen, playButtonSize } = usePlayerControlSizes({
    size,
    variant,
  })

  const togglePlay = async () => {
    try {
      return isPlaying ? await pause() : await play()
    } catch (error) {
      if (error instanceof Error && error.message.includes('activity is no longer available'))
        console.warn('[PlayerControls] Ignoring AppState-related error:', error.message)
      else {
        console.error('[PlayerControls] togglePlay error:', error)
        reportError(error, 'Ошибка при переключении воспроизведения')
        throw error
      }
    }
  }

  const toggleTrack = usePlayerToggleTrack({
    currentPlaylist,
    hasValidPlaylist,
    index,
    play,
    replaceAudio,
    setCurrentAudio,
    setLockScreenMetadata,
  })

  const isPrevDisabled = !hasValidPlaylist || isFirstTrack || !currentAudio

  const isNextDisabled = !hasValidPlaylist || isLastTrack || !currentAudio

  const renderFullscreenControls = () => (
    <FullscreenControls
      style={style}
      isPlaying={isPlaying}
      buttonSize={buttonSize}
      togglePlay={togglePlay}
      isBuffering={isBuffering}
      toggleTrack={toggleTrack}
      excludeButtons={excludeButtons}
      isNextDisabled={isNextDisabled}
      isPrevDisabled={isPrevDisabled}
      onPressOutSeek={onPressOutSeek}
      playButtonSize={playButtonSize}
      onLongPressSeek={onLongPressSeek}
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
      isNextDisabled={isNextDisabled}
      isPrevDisabled={isPrevDisabled}
      hasCurrentAudio={!!currentAudio}
    />
  )

  if (isFullscreen) return renderFullscreenControls()

  return renderDefaultControls()
}
