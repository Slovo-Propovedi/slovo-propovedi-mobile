import { StatusBar } from 'expo-status-bar'
import { type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'
import { GestureDetector, type GestureType } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { CoverImage } from 'shared/ui'
import type { createStyles } from './styles'
import type { AudioPlayerData } from 'shared/model'
import type { ThemeColors } from 'shared/ui/theme'
import { FullscreenContent } from '../FullscreenContent/FullscreenContent'

/** Consumer style must not carry geometry keys — enforced by compiler (Issue #63 invariant). */
export type NonGeometricStyle = Omit<ViewStyle, 'bottom' | 'height' | 'left' | 'top' | 'width'>

interface ContainerViewProps {
  audio: AudioPlayerData
  backgroundImageStyle: AnimatedStyle<ViewStyle>
  closeFullscreen: () => void
  containerStyle: AnimatedStyle<ViewStyle>
  currentTheme: ThemeColors
  expanded: boolean
  fullStyle: AnimatedStyle<ViewStyle>
  miniOverlay: ViewStyle
  miniOverlayStyle: AnimatedStyle<ViewStyle>
  onLayout: (event: LayoutChangeEvent) => void
  panGesture: GestureType
  restingContainerStyle: ViewStyle
  style?: StyleProp<NonGeometricStyle>
  styles: ReturnType<typeof createStyles>
}

export const ContainerView = ({
  audio,
  backgroundImageStyle,
  closeFullscreen,
  containerStyle,
  currentTheme,
  expanded,
  fullStyle,
  miniOverlay,
  miniOverlayStyle,
  onLayout,
  panGesture,
  restingContainerStyle,
  style,
  styles,
}: ContainerViewProps) => (
  <GestureDetector gesture={panGesture}>
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.container,
        // containerStyle (animated) wins at the NATIVE level for live animation
        // (Reanimated applies above static styles — round-3 law).
        // restingContainerStyle AFTER it wins at the SHADOW-TREE level (array
        // resolution is last-wins) — so the shadow tree always carries the correct
        // React-committed resting geometry; any Yoga relayout re-writes CORRECT
        // values instead of stale attach-era ones. This is the Issue #63
        // root-cause neutralization (Layer 6). Also doubles as the fallback if
        // the animated layer never attaches.
        //
        // Consumer `style` must NOT carry geometry keys (top/bottom/left/width/height):
        // enforced by NonGeometricStyle type (Issue #63 invariant).
        //
        // If a Yoga relayout fires mid-animation, the visible frame may snap to resting
        // geometry for at most one frame until the next animation frame re-applies animated
        // values — self-healing by design.
        containerStyle,
        restingContainerStyle,
        { backgroundColor: currentTheme.surface },
        style,
      ]}
    >
      <Animated.View style={[styles.backgroundContainer, backgroundImageStyle]}>
        <CoverImage eager uri={audio.artwork} style={styles.backgroundImage} />
      </Animated.View>
      <Animated.View pointerEvents='none' style={[miniOverlay, miniOverlayStyle]} />
      {expanded && <StatusBar style='light' />}
      <FullscreenContent styles={styles} fullStyle={fullStyle} onClose={closeFullscreen} />
    </Animated.View>
  </GestureDetector>
)
