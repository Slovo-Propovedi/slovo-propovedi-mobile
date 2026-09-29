import { ActivityIndicator, type StyleProp, View, type ViewStyle } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { PlayerControlButton } from '../control-button/control-button'
import { PlayerControlButtonType } from '../control-button/control-button.types'
import { getExcludedButtons } from '../getExcludedButtons'
import { playerControlsStyles as styles } from './PlayerControls.styles'
import { type ControlsNames, type PlayerControlsSize } from './PlayerControls.types'

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
}: {
  excludeButtons?: ControlsNames[]
  hasCurrentAudio: boolean
  isBuffering: boolean
  isPlaying: boolean
  isTrackButtonDisabled: boolean
  size: PlayerControlsSize
  style?: StyleProp<ViewStyle>
  togglePlay: () => Promise<void>
  toggleTrack: (dir: 'next' | 'prev') => Promise<void>
}) => {
  const { currentTheme } = useTheme()
  const excludedButtons = getExcludedButtons(excludeButtons)
  const showSpinner = isBuffering

  return (
    <View testID='controls-container' style={[styles.controlsContainer, style]}>
      {!excludedButtons[PlayerControlButtonType.Prev] && (
        <PlayerControlButton
          size={size}
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
            isDisabled={!hasCurrentAudio}
            type={isPlaying ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
          />
        ))}
      {!excludedButtons[PlayerControlButtonType.Next] && (
        <PlayerControlButton
          size={size}
          isDisabled={isTrackButtonDisabled}
          type={PlayerControlButtonType.Next}
          onPress={() => void toggleTrack('next')}
        />
      )}
    </View>
  )
}
