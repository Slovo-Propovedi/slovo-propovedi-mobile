import { type ViewStyle } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import { type AnimatedStyle } from 'react-native-reanimated'
import { useOnboardingTargetRef } from 'features/onboarding'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { type ThemeColors } from 'shared/ui/theme'
import { MiniPlayer } from './MiniPlayer'
import { type createMiniStyles } from './miniStyles'

/**
 * The collapsed mini-player layer, split out of ExpandablePlayer so the
 * container file stays within the line budget.
 * @param root0 - Mini-player inputs forwarded to MiniPlayer.
 * @param root0.audio - Current track audio.
 * @param root0.currentTheme - Active theme colors.
 * @param root0.isBuffering - Whether playback is buffering (shows the spinner).
 * @param root0.miniBarRestingStyle - React-committed resting pill geometry for the current bar state.
 * @param root0.miniBarStyle - Animated pill geometry during the bar morph.
 * @param root0.miniPan - Pan gesture that expands the player.
 * @param root0.miniStyle - Animated opacity style.
 * @param root0.miniStyles - Precomputed mini-player styles.
 * @param root0.onPlayPause - Play/pause toggle handler.
 * @param root0.onPress - Tap handler that expands the player.
 * @param root0.playing - Whether playback is active.
 * @param root0.playlist - Current playlist, if any.
 */
export const CollapsedMiniPlayer = ({
  audio,
  currentTheme,
  isBuffering,
  miniBarRestingStyle,
  miniBarStyle,
  miniPan,
  miniStyle,
  miniStyles,
  onPlayPause,
  onPress,
  playing,
  playlist,
}: {
  audio: AudioPlayerData
  currentTheme: ThemeColors
  isBuffering: boolean
  miniBarRestingStyle: ViewStyle
  miniBarStyle: AnimatedStyle<ViewStyle>
  miniPan: GestureType
  miniStyle: AnimatedStyle<ViewStyle>
  miniStyles: ReturnType<typeof createMiniStyles>
  onPlayPause: () => Promise<void>
  onPress: () => void
  playing: boolean
  playlist: null | PlaylistData
}) => {
  const miniTargetRef = useOnboardingTargetRef('player.mini')

  return (
    <MiniPlayer
      audio={audio}
      playing={playing}
      miniPan={miniPan}
      onPress={onPress}
      ref={miniTargetRef}
      playlist={playlist}
      miniStyle={miniStyle}
      miniStyles={miniStyles}
      onPlayPause={onPlayPause}
      showSpinner={isBuffering}
      miniBarStyle={miniBarStyle}
      currentTheme={currentTheme}
      miniBarRestingStyle={miniBarRestingStyle}
    />
  )
}
