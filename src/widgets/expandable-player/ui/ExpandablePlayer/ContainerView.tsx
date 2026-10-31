import { StatusBar } from 'expo-status-bar'
import { type LayoutChangeEvent, type StyleProp, View, type ViewStyle } from 'react-native'
import { GestureDetector, type GestureType } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { type AudioPlayerData } from 'entities/sermon'
import { useArtworkDominantColor } from 'shared/lib/useArtworkDominantColor'
import { type ThemeColors } from 'shared/ui/theme'
import { useFullscreenContentMount } from '../../model/useFullscreenContentMount'
import { FullscreenContent } from '../FullscreenContent/FullscreenContent'
import { type PlaylistMenuSlot } from '../PlaylistBottomSheet/PlaylistBottomSheet'
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
  miniOverlay,
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
  miniOverlay: ViewStyle
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
  const isFullscreenContentMounted = useFullscreenContentMount(expanded)
  const artworkBackgroundColor = useArtworkDominantColor(audio.artwork, currentTheme.surface)

  return (
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
        <Animated.View
          style={[
            styles.backgroundContainer,
            backgroundImageStyle,
            // Solid artwork-derived background; fades in over the surface via this layer.
            { backgroundColor: artworkBackgroundColor },
          ]}
        >
          <View pointerEvents='none' style={styles.backgroundScrim} />
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
