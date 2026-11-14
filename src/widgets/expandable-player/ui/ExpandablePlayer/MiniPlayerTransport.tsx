import { ActivityIndicator, View } from 'react-native'
import { OnboardingTarget } from 'features/onboarding'
import { PlayerControlButton, PlayerControlButtonType } from 'entities/player'
import { type ThemeColors } from 'shared/ui/theme'
import { type createMiniStyles, MINI_PLAY_HIT_SLOP } from './miniStyles'

/**
 * Play/pause side of the mini pill: the buffering spinner or the transport
 * button, wrapped in its onboarding target.
 * @param root0 - Transport props.
 * @param root0.currentTheme - Active theme colors.
 * @param root0.miniStyles - Pill styles built for the active theme.
 * @param root0.onPlayPause - Play/pause toggle handler.
 * @param root0.playing - Whether playback is active.
 * @param root0.showSpinner - Whether to show the buffering spinner instead.
 */
export const MiniPlayerTransport = ({
  currentTheme,
  miniStyles,
  onPlayPause,
  playing,
  showSpinner,
}: {
  currentTheme: ThemeColors
  miniStyles: ReturnType<typeof createMiniStyles>
  onPlayPause: () => Promise<void>
  playing: boolean
  showSpinner: boolean
}) => (
  <View style={miniStyles.miniControls}>
    {showSpinner ? (
      <ActivityIndicator size={36} color={currentTheme.text} testID='buffering-indicator' />
    ) : (
      <OnboardingTarget id='player.mini-play-pause'>
        <PlayerControlButton
          size={36}
          onPress={onPlayPause}
          color={currentTheme.text}
          hitSlop={MINI_PLAY_HIT_SLOP}
          style={miniStyles.miniPlayButton}
          type={playing ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
        />
      </OnboardingTarget>
    )}
  </View>
)
