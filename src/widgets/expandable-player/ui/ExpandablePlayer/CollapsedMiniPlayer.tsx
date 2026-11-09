import { type ViewStyle } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { useOnboardingTargetRef } from 'features/onboarding'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { useKeyboardLiftStyle } from 'shared/ui/layout'
import { type ThemeColors } from 'shared/ui/theme'
import { miniLayerStyle } from './commonStyles'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles } from './miniStyles'

/**
 * The collapsed mini-player layer, split out of ExpandablePlayer so the
 * container file stays within the line budget.
 * @param root0 - Mini-player inputs forwarded to MiniPlayer.
 * @param root0.audio - Current track audio.
 * @param root0.barCollapsed - Whether the bar (and pill) rests in the collapsed row.
 * @param root0.currentTheme - Active theme colors.
 * @param root0.degraded - Whether a morph owns the pill, so its glass drops blur and shadow.
 * @param root0.isBuffering - Whether playback is buffering (shows the spinner).
 * @param root0.isLight - Active theme flag for the shared glass layers.
 * @param root0.miniBarRestingStyle - React-committed resting pill geometry for the current bar state.
 * @param root0.miniBarStyle - Animated pill geometry during the bar morph.
 * @param root0.miniPan - Pan gesture that expands the player.
 * @param root0.miniStyle - Animated opacity style.
 * @param root0.onPlayPause - Play/pause toggle handler.
 * @param root0.onPress - Tap handler that expands the player.
 * @param root0.playing - Whether playback is active.
 * @param root0.playlist - Current playlist, if any.
 */
export const CollapsedMiniPlayer = ({
  audio,
  barCollapsed,
  currentTheme,
  degraded,
  isBuffering,
  isLight,
  miniBarRestingStyle,
  miniBarStyle,
  miniPan,
  miniStyle,
  onPlayPause,
  onPress,
  playing,
  playlist,
}: {
  audio: AudioPlayerData
  barCollapsed: boolean
  currentTheme: ThemeColors
  degraded: boolean
  isBuffering: boolean
  isLight: boolean
  miniBarRestingStyle: ViewStyle
  miniBarStyle: AnimatedStyle<ViewStyle>
  miniPan: GestureType
  miniStyle: AnimatedStyle<ViewStyle>
  onPlayPause: () => Promise<void>
  onPress: () => void
  playing: boolean
  playlist: null | PlaylistData
}) => {
  const miniTargetRef = useOnboardingTargetRef('player.mini')
  const miniStyles = createMiniStyles(currentTheme)
  const keyboardLiftStyle = useKeyboardLiftStyle()

  return (
    <Animated.View pointerEvents='box-none' style={[miniLayerStyle, keyboardLiftStyle]}>
      <MiniPlayer
        audio={audio}
        playing={playing}
        miniPan={miniPan}
        onPress={onPress}
        isLight={isLight}
        ref={miniTargetRef}
        playlist={playlist}
        degraded={degraded}
        miniStyle={miniStyle}
        miniStyles={miniStyles}
        onPlayPause={onPlayPause}
        showSpinner={isBuffering}
        barCollapsed={barCollapsed}
        miniBarStyle={miniBarStyle}
        currentTheme={currentTheme}
        miniBarRestingStyle={miniBarRestingStyle}
      />
    </Animated.View>
  )
}
