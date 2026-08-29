import { ActivityIndicator, View } from 'react-native'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import type { ControlsNames, PlayerControlsSize } from './PlayerControls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import { getExcludedButtons } from '../getExcludedButtons'
import { playerControlsStyles as styles } from './PlayerControls.styles'

interface DefaultControlsProps {
  excludeButtons?: ControlsNames[]
  hasCurrentAudio: boolean
  isBuffering: boolean
  isPlaying: boolean
  isTrackButtonDisabled: boolean
  size: PlayerControlsSize
  style?: StyleProp<ViewStyle>
  togglePlay: () => Promise<void>
  toggleTrack: (dir: 'next' | 'prev') => Promise<void>
}

export const DefaultControls = ({
  excludeButtons,
  hasCurrentAudio,
  isBuffering,
  isPlaying,
  isTrackButtonDisabled,
  size,
  style,
  togglePlay,
  toggleTrack,
}: DefaultControlsProps) => {
  const { currentTheme } = useTheme()
  const excludedButtons = getExcludedButtons(excludeButtons)
  const showSpinner = isBuffering

  return (
    <View testID='controls-container' style={[styles.controlsContainer, style]}>
      {!excludedButtons[PlayerControlButtonType.Prev] && (
        <PlayerControlButton
          size={size}
          testID='prev-button'
          isDisabled={isTrackButtonDisabled}
          type={PlayerControlButtonType.Prev}
          onPress={() => void toggleTrack('prev')}
        />
      )}
      {!excludedButtons[PlayerControlButtonType.Play] &&
        (showSpinner ? (
          <View testID='buffering-indicator'>
            <ActivityIndicator
              color={currentTheme.primary}
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
          testID='next-button'
          isDisabled={isTrackButtonDisabled}
          type={PlayerControlButtonType.Next}
          onPress={() => void toggleTrack('next')}
        />
      )}
    </View>
  )
}
