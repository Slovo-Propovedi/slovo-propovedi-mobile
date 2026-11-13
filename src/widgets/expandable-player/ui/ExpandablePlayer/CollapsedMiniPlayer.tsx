import { useAtom } from '@reatom/npm-react'
import { type ViewStyle } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle, useAnimatedStyle } from 'react-native-reanimated'
import { searchFocusMorphDriver } from 'widgets/search-island/@x/morphDrivers'
import { useOnboardingTargetRef } from 'features/onboarding'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { useKeyboardLiftStyle } from 'shared/ui/layout'
import { type ThemeColors } from 'shared/ui/theme'
import { MINI_PILL_TUCK_DISTANCE } from '../../lib/getMiniPlayerGeometry'
import { useMiniPillFade } from '../../model/useMiniPillFade'
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
  const pillOpacity = useMiniPillFade(isHidden)
  const tuckStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: MINI_PILL_TUCK_DISTANCE * focusProgress.value }],
  }))
  const fadeStyle = useAnimatedStyle(() => ({ opacity: pillOpacity.value }))

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
