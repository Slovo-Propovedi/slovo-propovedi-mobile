import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { COLORS, INDENTS } from 'shared/ui/themed'
import type { ControlsNames } from './PlayerControls/PlayerControls.types'
import type { StyleProp, ViewStyle } from 'react-native'
import { getExcludedButtons } from './getExcludedButtons'

interface FullscreenControlsProps {
  buttonSize: number
  excludeButtons?: ControlsNames[]
  isBuffering: boolean
  isNextDisabled: boolean
  isPlaying: boolean
  isPrevDisabled: boolean
  onLongPressSeek?: (direction: 'backward' | 'forward') => void
  onPressOutSeek?: () => void
  playButtonSize: number
  style?: StyleProp<ViewStyle>
  togglePlay: () => Promise<void>
  toggleTrack: (dir: 'next' | 'prev') => Promise<void>
}

export const FullscreenControls = ({
  buttonSize,
  excludeButtons,
  isBuffering,
  isNextDisabled,
  isPlaying,
  isPrevDisabled,
  onLongPressSeek,
  onPressOutSeek,
  playButtonSize,
  style,
  togglePlay,
  toggleTrack,
}: FullscreenControlsProps) => {
  const excludedButtons = getExcludedButtons(excludeButtons)
  const showSpinner = isBuffering

  return (
    <View style={[styles.container, style]}>
      {!excludedButtons[PlayerControlButtonType.Prev] && (
        <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
          {!isPrevDisabled && (
            <PlayerControlButton
              size={buttonSize}
              color={COLORS.white}
              testID='prev-button'
              onPressOut={onPressOutSeek}
              type={PlayerControlButtonType.Prev}
              onPress={() => void toggleTrack('prev')}
              onLongPress={onLongPressSeek ? () => onLongPressSeek('backward') : undefined}
            />
          )}
        </View>
      )}
      {!excludedButtons[PlayerControlButtonType.Play] &&
        (showSpinner ? (
          <View
            testID='buffering-indicator'
            style={[styles.playButtonWrapper, { height: playButtonSize, width: playButtonSize }]}
          >
            <ActivityIndicator size='large' color={COLORS.white} />
          </View>
        ) : (
          <View
            style={[styles.playButtonWrapper, { height: playButtonSize, width: playButtonSize }]}
          >
            <PlayerControlButton
              color={COLORS.white}
              onPress={togglePlay}
              testID='play-button'
              size={playButtonSize}
              type={isPlaying ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
            />
          </View>
        ))}
      {!excludedButtons[PlayerControlButtonType.Next] && (
        <View style={[styles.buttonWrapper, { height: buttonSize, width: buttonSize }]}>
          {!isNextDisabled && (
            <PlayerControlButton
              size={buttonSize}
              color={COLORS.white}
              onPressOut={onPressOutSeek}
              type={PlayerControlButtonType.Next}
              onPress={() => void toggleTrack('next')}
              onLongPress={onLongPressSeek ? () => onLongPressSeek('forward') : undefined}
            />
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: INDENTS.medium,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: INDENTS.high,
  },
})
