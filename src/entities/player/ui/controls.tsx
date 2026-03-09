import { useAction, useAtom } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { isNonNullable } from 'shared/lib'
import { COLORS } from 'shared/themed'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import type { AudioPlayerData, ControlsNames } from './controls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import type { PlaylistData } from 'shared/types'
import { usePlayer } from '../hooks'
import {
  currentSoundDurationAtom,
  currentSoundPositionAtom,
  isCurrentSoundBufferingAtom,
  isPlayingCurrentAudioAtom,
  setCurrentSound as setCurrentSoundAction,
} from '../model'
import { schedulePushNotification } from '../utils'
import { playerControlsStyles as styles } from './controls.styles'
import { PlayerControlsSize } from './controls.types'
import {
  getExcludedButtons,
  getIndexOfCurrentAudioInPlaylist,
  getIsNotAvailableNext,
} from './controls.utils'

interface PlayerControlsProps {
  currentAudio: AudioPlayerData | null
  currentPlaylist: null | PlaylistData
  excludeButtons?: ControlsNames[]
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  size?: PlayerControlsSize
  style?: StyleProp<ViewStyle>
}

export const PlayerControls = ({
  currentAudio,
  currentPlaylist,
  excludeButtons,
  setCurrentAudio,
  size = PlayerControlsSize.Large,
  style,
}: PlayerControlsProps) => {
  const { pause, play, recreateSound } = usePlayer()
  const currentSoundDuration = useAtom(currentSoundDurationAtom)[0]
  const currentSoundPosition = useAtom(currentSoundPositionAtom)[0]
  const isCurrentSoundBuffering = useAtom(isCurrentSoundBufferingAtom)[0]
  const isPlayingCurrentAudio = useAtom(isPlayingCurrentAudioAtom)[0]
  const setCurrentSound = useAction(setCurrentSoundAction)
  const excludedButtons = getExcludedButtons(excludeButtons)
  const indexOfCurrentAudioInPlaylist = getIndexOfCurrentAudioInPlaylist(
    currentAudio,
    currentPlaylist,
  )
  const isNotAvailableNext = getIsNotAvailableNext(currentPlaylist, indexOfCurrentAudioInPlaylist)

  const togglePlay = async () => {
    if (isPlayingCurrentAudio) return await pause()
    return await play()
  }

  const toggleTrack = async (dir: 'next' | 'prev') => {
    if (!isNonNullable(indexOfCurrentAudioInPlaylist) || !currentPlaylist) return
    const { audioUrl, ...otherProps } =
      currentPlaylist.list[
        dir === 'next' ? indexOfCurrentAudioInPlaylist + 1 : indexOfCurrentAudioInPlaylist - 1
      ]
    if (!audioUrl) return
    const newAudio = { ...otherProps, audioUrl, previewUrl: currentPlaylist.previewUrl }
    await setCurrentAudio(newAudio)
    const newSound = await recreateSound(newAudio.audioUrl)
    if (newSound) setCurrentSound(newSound)
    await schedulePushNotification({
      body: newAudio.description || '',
      subtitle: currentPlaylist.title || 'Проповедует Андрей Вовк',
      title: newAudio.title,
    })
    await play(newSound)
  }

  useEffect(() => {
    if (!currentSoundDuration) return
    if (currentSoundPosition >= currentSoundDuration && !isNotAvailableNext)
      void toggleTrack('next')
  }, [currentSoundDuration, currentSoundPosition, isNotAvailableNext])

  const isPrevDisabled = indexOfCurrentAudioInPlaylist === 0 || !currentAudio
  const isNextDisabled = isNotAvailableNext || !currentAudio

  return (
    <View testID='controls-container' style={[styles.controlsContainer, style]}>
      {!excludedButtons[PlayerControlButtonType.Prev] && (
        <PlayerControlButton
          size={size}
          testID='prev-button'
          isDisabled={isPrevDisabled}
          type={PlayerControlButtonType.Prev}
          onPress={() => void toggleTrack('prev')}
        />
      )}
      {!excludedButtons[PlayerControlButtonType.Play] &&
        (isCurrentSoundBuffering ? (
          <View>
            <ActivityIndicator
              color={COLORS.primary}
              size={size * 2 - styles.bufferingText.fontSize}
            />
          </View>
        ) : (
          <PlayerControlButton
            size={size * 2}
            onPress={togglePlay}
            testID='play-button'
            isDisabled={!currentAudio}
            type={
              isPlayingCurrentAudio ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play
            }
          />
        ))}
      {!excludedButtons[PlayerControlButtonType.Next] && (
        <PlayerControlButton
          size={size}
          isDisabled={isNextDisabled}
          type={PlayerControlButtonType.Next}
          onPress={() => void toggleTrack('next')}
        />
      )}
    </View>
  )
}
