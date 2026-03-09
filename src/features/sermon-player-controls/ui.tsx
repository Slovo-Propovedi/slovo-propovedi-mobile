import { useAction, useAtom } from '@reatom/npm-react'
import React from 'react'
import { PlayerControls } from 'entities/player'
import type { ControlsNames, PlayerControlsSize } from 'entities/player'
import type { StyleProp, ViewStyle } from 'react-native'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  setCurrentAudio as setCurrentAudioAction,
} from './model'

interface SermonPlayerControlsProps {
  excludeButtons?: ControlsNames[]
  size?: PlayerControlsSize
  style?: StyleProp<ViewStyle>
}

export const SermonPlayerControls = ({
  excludeButtons,
  size,
  style,
}: SermonPlayerControlsProps) => {
  const currentAudio = useAtom(currentAudioAtom)[0]
  const currentPlaylist = useAtom(currentPlaylistAtom)[0]
  const setCurrentAudio = useAction(setCurrentAudioAction)

  return (
    <PlayerControls
      size={size}
      style={style}
      currentAudio={currentAudio}
      excludeButtons={excludeButtons}
      currentPlaylist={currentPlaylist}
      setCurrentAudio={setCurrentAudio}
    />
  )
}
