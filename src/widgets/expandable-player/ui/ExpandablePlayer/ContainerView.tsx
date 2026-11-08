import { StatusBar } from 'expo-status-bar'
import { type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'
import { GestureDetector, type GestureType } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle, useAnimatedStyle } from 'react-native-reanimated'
import { type AudioPlayerData } from 'entities/sermon'
import { CoverImage } from 'shared/ui'
import { keyboardBottomInsetSv } from 'shared/ui/layout'
import { type ThemeColors } from 'shared/ui/theme'
import { useFullscreenContentMount } from '../../model/useFullscreenContentMount'
import { FullscreenContent } from '../FullscreenContent/FullscreenContent'
import { type PlaylistMenuSlot } from '../PlaylistBottomSheet/PlaylistBottomSheet'
import { createMiniStyles } from './miniStyles'
import { type createStyles } from './styles'

/** Consumer style must not carry geometry keys — enforced by compiler (Issue #63 invariant). */
export type NonGeometricStyle = Omit<ViewStyle, 'bottom' | 'height' | 'left' | 'top' | 'width'>

export const ContainerView = ({
  audio,
  backgroundImageStyle,
  closeFullscreen,
  containerStyle,
  currentTheme,
  expanded,
  fullStyle,
  isLight,
  miniOverlayStyle,
  onAddToPlaylist,
  onLayout,
  panGesture,
  playlistMenuComponent,
  restingContainerStyle,
  style,
  styles,
}: {
  audio: AudioPlayerData
  backgroundImageStyle: AnimatedStyle<ViewStyle>
  closeFullscreen: () => void
  containerStyle: AnimatedStyle<ViewStyle>
  currentTheme: ThemeColors
  expanded: boolean
  fullStyle: AnimatedStyle<ViewStyle>
  isLight: boolean
  miniOverlayStyle: AnimatedStyle<ViewStyle>
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  onLayout: (event: LayoutChangeEvent) => void
  panGesture: GestureType
  playlistMenuComponent?: PlaylistMenuSlot
  restingContainerStyle: ViewStyle
  style?: StyleProp<NonGeometricStyle>
  styles: ReturnType<typeof createStyles>
}) => {
  // FullscreenContent stays mounted through the collapse animation so the exit
  // fade is visible, then unmounts to stop its per-tick re-render storm (Issue #100).
  const miniOverlay = createMiniStyles(currentTheme, isLight).miniOverlay
  const isFullscreenContentMounted = useFullscreenContentMount(expanded)
  // The collapsed container doubles as the mini overlay under the pill, so it
  // follows the keyboard with the rest of the bottom chrome. At fullscreen the
  // shift is zero: the keyboard is irrelevant for the full-window sheet.
  const keyboardLiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: expanded ? 0 : -keyboardBottomInsetSv.value }],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        onLayout={onLayout}
        // Fullscreen-only layer: at rest the container is invisible yet still
        // sits above the mini pill in the web paint order (the pill's parent
        // layer carries a transform, which makes its zIndex local to that
        // stacking context). Without this gate the container swallows every
        // tap/swipe aimed at the pill on web. Must be the PROP, not a style
        // key — see docs/features/web.md «pointerEvents на web».
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[
          styles.container,
          // containerStyle (animated) wins at the NATIVE level for live animation
          // (Reanimated applies above static styles — round-3 law).
          // restingContainerStyle AFTER it wins at the SHADOW-TREE level (array
          // resolution is last-wins) — so the shadow tree always carries the correct
          // React-committed resting geometry; any Yoga relayout re-writes CORRECT
          // values instead of stale attach-era ones. This is the Issue #63
          // root-cause neutralization (Layer 6). Also doubles as the fallback if
          // the animated layer never attaches. During a morph the hook feeds the
          // SETTLED (start) state here — never the destination a frame early.
          //
          // Consumer `style` must NOT carry geometry keys (top/bottom/left/width/height):
          // enforced by NonGeometricStyle type (Issue #63 invariant).
          //
          containerStyle,
          restingContainerStyle,
          { backgroundColor: currentTheme.surface },
          style,
          keyboardLiftStyle,
        ]}
      >
        <Animated.View style={[styles.backgroundContainer, backgroundImageStyle]}>
          <CoverImage eager transition={0} uri={audio.artwork} style={styles.backgroundImage} />
        </Animated.View>
        <Animated.View style={[miniOverlay, miniOverlayStyle, { pointerEvents: 'none' }]} />
        {expanded && <StatusBar style='light' />}
        {isFullscreenContentMounted && (
          <FullscreenContent
            styles={styles}
            fullStyle={fullStyle}
            onClose={closeFullscreen}
            onAddToPlaylist={onAddToPlaylist}
            playlistMenuComponent={playlistMenuComponent}
          />
        )}
      </Animated.View>
    </GestureDetector>
  )
}
