import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { type ViewStyle } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import Animated, {
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useOnboardingTargetRef } from 'features/onboarding'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { BAR_MORPH_DURATION_MS, BAR_OUTER_GAP, useKeyboardLiftStyle } from 'shared/ui/layout'
import { PLAYER_SIZES, type ThemeColors } from 'shared/ui/theme'
import { miniLayerStyle } from './commonStyles'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles } from './miniStyles'

// Sliding the pill down by its own height plus the two outer gaps lands its top
// on the focused full-width search pill's top, so it disappears behind it.
const MINI_TUCK_DISTANCE = PLAYER_SIZES.miniPlayerHeight + BAR_OUTER_GAP * 2

/**
 * The collapsed mini-player layer, split out of ExpandablePlayer so the
 * container file stays within the line budget.
 * @param root0 - Mini-player inputs forwarded to MiniPlayer.
 * @param root0.audio - Current track audio.
 * @param root0.barCollapsed - Whether the bar (and pill) rests in the collapsed row.
 * @param root0.currentTheme - Active theme colors.
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
  const [isHidden] = useAtom(isSearchFieldFocusedAtom)
  const focusProgress = useSharedValue(isHidden ? 1 : 0)
  const tuckStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: MINI_TUCK_DISTANCE * focusProgress.value }],
  }))

  // Starts after the commit so the player root's zIndex (dropped below the tab
  // bar) is in place before the first tucked frame. Stays mounted while hidden.
  useEffect(() => {
    focusProgress.value = withTiming(isHidden ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [focusProgress, isHidden])

  return (
    <Animated.View
      accessibilityElementsHidden={isHidden}
      style={[miniLayerStyle, keyboardLiftStyle]}
      pointerEvents={isHidden ? 'none' : 'box-none'}
      importantForAccessibility={isHidden ? 'no-hide-descendants' : 'yes'}
    >
      <MiniPlayer
        audio={audio}
        playing={playing}
        miniPan={miniPan}
        onPress={onPress}
        isLight={isLight}
        ref={miniTargetRef}
        playlist={playlist}
        miniStyle={miniStyle}
        tuckStyle={tuckStyle}
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
