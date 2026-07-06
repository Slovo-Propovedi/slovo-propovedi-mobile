import { ActivityIndicator, View } from 'react-native'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { COLORS } from 'shared/ui/themed'
import type { ControlsNames, PlayerControlsSize } from '../PlayerControls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import { getExcludedButtons } from '../getExcludedButtons'
import { playerControlsStyles as styles } from './PlayerControls.styles'

interface DefaultControlsProps {
  excludeButtons?: ControlsNames[]
  hasCurrentAudio: boolean
  isBuffering: boolean
  isDownloading: boolean
  isNextDisabled: boolean
  isPlaying: boolean
  isPrevDisabled: boolean
  size: PlayerControlsSize
  style?: StyleProp<ViewStyle>
  togglePlay: () => Promise<void>
  toggleTrack: (dir: 'next' | 'prev') => Promise<void>
}

export const DefaultControls = ({
  excludeButtons,
  hasCurrentAudio,
  isBuffering,
  isDownloading,
  isNextDisabled,
  isPlaying,
  isPrevDisabled,
  size,
  style,
  togglePlay,
  toggleTrack,
}: DefaultControlsProps) => {
  const excludedButtons = getExcludedButtons(excludeButtons)
  const showSpinner = isBuffering || isDownloading

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
        (showSpinner ? (
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
            isDisabled={!hasCurrentAudio}
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
