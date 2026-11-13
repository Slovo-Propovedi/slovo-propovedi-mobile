import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { type ViewStyle } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import Animated, {
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { searchFocusMorphDriver } from 'widgets/search-island/@x/morphDrivers'
import { useOnboardingTargetRef } from 'features/onboarding'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { BAR_MORPH_DURATION_MS, useKeyboardLiftStyle } from 'shared/ui/layout'
import { type ThemeColors } from 'shared/ui/theme'
import { MINI_PILL_TUCK_DISTANCE } from '../../lib/getMiniPlayerGeometry'
import { miniLayerStyle } from './commonStyles'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles } from './miniStyles'

// The islands above are translucent glass, so the tucked pill must fade out
// after the slide; 180 ms reads as one motion rather than a second step.
const MINI_TUCK_FADE_MS = 180

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
  // Same shared value the search frame and the shade's pill cutout read.
  const { progress: focusProgress } = useAtomMorphDriver(searchFocusMorphDriver)
  const pillOpacity = useSharedValue(isHidden ? 0 : 1)
  const tuckStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: MINI_PILL_TUCK_DISTANCE * focusProgress.value }],
  }))
  const fadeStyle = useAnimatedStyle(() => ({ opacity: pillOpacity.value }))

  // Starts after the commit so the player root's zIndex (dropped below the tab
  // bar) is in place before the first tucked frame. Stays mounted while hidden.
  useEffect(() => {
    // Focus: slide under first, then fade out. Blur: fade back in while the
    // pill slides up (simultaneous reverse, so the pill is visible as it rises).
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in effect (withDelay/withTiming sequencing below)
    pillOpacity.value = isHidden
      ? withDelay(BAR_MORPH_DURATION_MS, withTiming(0, { duration: MINI_TUCK_FADE_MS }))
      : withTiming(1, { duration: MINI_TUCK_FADE_MS })
  }, [isHidden, pillOpacity])

  return (
    <Animated.View
      accessibilityElementsHidden={isHidden}
      pointerEvents={isHidden ? 'none' : 'box-none'}
      style={[miniLayerStyle, keyboardLiftStyle, fadeStyle]}
      importantForAccessibility={isHidden ? 'no-hide-descendants' : 'yes'}
    >
      <MiniPlayer
        audio={audio}
        playing={playing}
        miniPan={miniPan}
        onPress={onPress}
        isLight={isLight}
        isTucked={isHidden}
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
