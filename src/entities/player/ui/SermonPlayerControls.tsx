import { useAction, useAtom } from '@reatom/npm-react'
import React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { currentAudioAtom, currentPlaylistAtom, setCurrentAudioAction } from '../model'
import { PlayerControls } from './PlayerControls'
import { type ControlsNames, type PlayerControlsSize } from './PlayerControls.types'

type PlayerControlsVariant = 'default' | 'fullscreen'

interface SermonPlayerControlsProps {
  excludeButtons?: ControlsNames[]
  onLongPressSeek?: (direction: 'backward' | 'forward') => void
  onPressOutSeek?: () => void
  size?: PlayerControlsSize
  style?: StyleProp<ViewStyle>
  variant?: PlayerControlsVariant
}

export const SermonPlayerControls = ({
  excludeButtons,
  onLongPressSeek,
  onPressOutSeek,
  size,
  style,
  variant,
}: SermonPlayerControlsProps) => {
  const currentAudio = useAtom(currentAudioAtom)[0]
  const currentPlaylist = useAtom(currentPlaylistAtom)[0]
  const setCurrentAudio = useAction(setCurrentAudioAction)

  return (
    <PlayerControls
      size={size}
      style={style}
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
