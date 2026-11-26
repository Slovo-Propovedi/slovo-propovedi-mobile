import { useAction, useAtom } from '@reatom/npm-react'
import { type OpaqueColorValue, type StyleProp, type ViewStyle } from 'react-native'
import { currentAudioAtom, currentPlaylistAtom, setCurrentAudioAction } from '../model'
import { PlayerControls } from './PlayerControls/PlayerControls'
import { type ControlsNames, type PlayerControlsSize } from './PlayerControls/PlayerControls.types'

type PlayerControlsVariant = 'default' | 'fullscreen'

export const SermonPlayerControls = ({
  color,
  excludeButtons,
  onLongPressSeek,
  onPressOutSeek,
  size,
  style,
  variant,
}: {
  /** Icon tint for the default (non-fullscreen) variant; fullscreen keeps its white icons. */
  color?: OpaqueColorValue | string
  excludeButtons?: ControlsNames[]
  onLongPressSeek?: (direction: 'backward' | 'forward') => void
  onPressOutSeek?: () => void
  size?: PlayerControlsSize
  style?: StyleProp<ViewStyle>
  variant?: PlayerControlsVariant
}) => {
  const currentAudio = useAtom(currentAudioAtom)[0]
  const currentPlaylist = useAtom(currentPlaylistAtom)[0]
  const setCurrentAudio = useAction(setCurrentAudioAction)

  return (
    <PlayerControls
      size={size}
      style={style}
      color={color}
      variant={variant}
      currentAudio={currentAudio}
      excludeButtons={excludeButtons}
      onPressOutSeek={onPressOutSeek}
      currentPlaylist={currentPlaylist}
      onLongPressSeek={onLongPressSeek}
      setCurrentAudio={setCurrentAudio}
    />
  )
}
