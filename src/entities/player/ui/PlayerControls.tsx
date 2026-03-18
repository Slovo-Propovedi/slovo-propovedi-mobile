import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { isNonNullable } from 'shared/lib/utils'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { COLORS } from 'shared/ui/themed'
import type { AudioPlayerData, ControlsNames } from './PlayerControls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import type { PlaylistData } from 'shared/model'
import { usePlayer } from '../lib/usePlayer'
import { usePlayerState } from '../lib/usePlayerState'
import { getExcludedButtons } from './getExcludedButtons'
import { getIndexOfCurrentAudioInPlaylist } from './getIndexOfCurrentAudioInPlaylist'
import { playerControlsStyles as styles } from './PlayerControls.styles'
import { PlayerControlsSize } from './PlayerControls.types'

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
  const { loadAudio, pause, play } = usePlayer()
  const { duration, isBuffering, isPlaying, position } = usePlayerState()
  const excludedButtons = getExcludedButtons(excludeButtons)
  const indexOfCurrentAudioInPlaylist = getIndexOfCurrentAudioInPlaylist(
    currentAudio,
    currentPlaylist,
  )

  const hasValidPlaylist =
    isNonNullable(currentPlaylist) && isNonNullable(indexOfCurrentAudioInPlaylist)
  const isLastTrack = hasValidPlaylist
    ? indexOfCurrentAudioInPlaylist === currentPlaylist.list.length - 1
    : false
  const isFirstTrack = hasValidPlaylist ? indexOfCurrentAudioInPlaylist === 0 : false

  const togglePlay = async () => {
    if (isPlaying) return await pause()
    return await play()
  }

  const toggleTrack = async (dir: 'next' | 'prev') => {
    if (!hasValidPlaylist || !currentPlaylist) return

    const newIndex =
      dir === 'next' ? indexOfCurrentAudioInPlaylist + 1 : indexOfCurrentAudioInPlaylist - 1
    const track = currentPlaylist.list[newIndex]

    if (!track?.audioUrl) return

    const { audioUrl, ...otherProps } = track
    const newAudio = { ...otherProps, audioUrl, previewUrl: currentPlaylist.previewUrl }

    await setCurrentAudio(newAudio)
    await loadAudio(newAudio.audioUrl)
    await play()
  }

  useEffect(() => {
    if (!duration || !hasValidPlaylist || isLastTrack) return
    if (position >= duration) void toggleTrack('next')
  }, [duration, position, hasValidPlaylist, isLastTrack])

  const isPrevDisabled = !hasValidPlaylist || isFirstTrack || !currentAudio
  const isNextDisabled = !hasValidPlaylist || isLastTrack || !currentAudio

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
        (isBuffering ? (
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
            type={isPlaying ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
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
