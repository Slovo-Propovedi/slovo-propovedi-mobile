import { useAction, useAtom } from '@reatom/npm-react'
import React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { currentAudioAtom, currentPlaylistAtom, setCurrentAudioAction } from '../model'
import { PlayerControls } from './PlayerControls'
import { type ControlsNames, type PlayerControlsSize } from './PlayerControls.types'

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
