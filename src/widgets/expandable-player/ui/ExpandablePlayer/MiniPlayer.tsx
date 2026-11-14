import { forwardRef } from 'react'
import { Platform, View, type ViewInstance, type ViewStyle } from 'react-native'
import { GestureDetector, type GestureType } from 'react-native-gesture-handler'
import { type AnimatedStyle } from 'react-native-reanimated'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { CoverImage, GlassIsland, MovingText, useMarqueeCycle, usePageBlurTarget } from 'shared/ui'
import { type ThemeColors } from 'shared/ui/theme'
import { getPlayerSubtitle } from '../../lib/getPlayerSubtitle'
import { MiniDownloadProgress } from './MiniDownloadProgress'
import { MiniPlayerTransport } from './MiniPlayerTransport'
import { type createMiniStyles } from './miniStyles'

// Web: the row renders as <div role="link" tabindex=0> (RNW maps 'link' to the
// role attribute, no <a> tag) so the inner play/pause <button> is not nested
// inside another <button> (validateDOMNesting error). Native keeps the button
// role. Same container pattern as TracksListItemBase ROW_ACCESSIBILITY_ROLE.
const ROW_ACCESSIBILITY_ROLE = Platform.OS === 'web' ? 'link' : 'button'

interface MiniPlayerProps {
  audio: AudioPlayerData
  /** Bar state the pill rests in: collapsed mirrors the artwork inset on both sides. */
  barCollapsed: boolean
  currentTheme: ThemeColors
  // Theme flag for the shared glass layers; the pill frosts like the tab island.
  isLight: boolean
  /** Tucked under the focused search row: any own shadow would bleed around it. */
  isTucked?: boolean
  miniBarRestingStyle: ViewStyle
  miniBarStyle: AnimatedStyle<ViewStyle>
  miniPan: GestureType
  miniStyle: AnimatedStyle<ViewStyle>
  miniStyles: ReturnType<typeof createMiniStyles>
  onPlayPause: () => Promise<void>
  onPress: () => void
  playing: boolean
  playlist: null | PlaylistData
  showSpinner: boolean
  /** Slide-down offset that tucks the pill under the focused search row. */
  tuckStyle?: AnimatedStyle<ViewStyle>
}

export const MiniPlayer = forwardRef<ViewInstance, MiniPlayerProps>(
  (
    {
      audio,
      barCollapsed,
      currentTheme,
      isLight,
      isTucked,
      miniBarRestingStyle,
      miniBarStyle,
      miniPan,
      miniStyle,
      miniStyles,
      onPlayPause,
      onPress,
      playing,
      playlist,
      showSpinner,
      tuckStyle,
    },
    ref,
  ) => {
    const subtitle = getPlayerSubtitle(audio, playlist)
    // The pill floats over the page (search overlay included), never over the
    // tab-bar shade, so it frosts the page target instead of the chrome's.
    const pageBlurTarget = usePageBlurTarget()
    // The title owns the marquee cycle; the subtitle only follows it, so both
    // lines restart together and neither overruns the other's rhythm.
    const marqueeCycle = useMarqueeCycle()

    return (
      <GestureDetector gesture={miniPan}>
        <GlassIsland
          ref={ref}
          onPress={onPress}
          isLight={isLight}
          blurTarget={pageBlurTarget}
          accessibilityRole={ROW_ACCESSIBILITY_ROLE}
          hostStyle={[
            miniStyles.miniContainer,
            barCollapsed && miniStyles.miniContainerCollapsed,
            isTucked && miniStyles.miniContainerTucked,
          ]}
          animatedStyle={[
            miniStyle,
            // Animated geometry wins at the native level; the React resting style
            // last keeps the shadow tree on the settled bar state's geometry (#63).
            miniBarStyle,
            miniBarRestingStyle,
            tuckStyle,
          ]}
        >
          <CoverImage eager uri={audio.artwork} style={miniStyles.miniCover} />
          <View style={miniStyles.miniTextContainer}>
            <MovingText
              fadeEdge
              autoStart
              text={audio.title || ''}
              publishCycle={marqueeCycle}
              style={miniStyles.miniTrackTitle}
            />
            <MovingText
              fadeEdge
              text={subtitle}
              followCycle={marqueeCycle}
              style={miniStyles.miniPlaylistName}
            />
          </View>
          <MiniPlayerTransport
            playing={playing}
            miniStyles={miniStyles}
            onPlayPause={onPlayPause}
            showSpinner={showSpinner}
            currentTheme={currentTheme}
          />
          <MiniDownloadProgress miniStyles={miniStyles} audioUrl={audio.audioUrl} />
        </GlassIsland>
      </GestureDetector>
    )
  },
)
MiniPlayer.displayName = 'MiniPlayer'
