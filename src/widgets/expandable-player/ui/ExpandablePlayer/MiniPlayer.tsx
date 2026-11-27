import { forwardRef } from 'react'
import { Platform, View, type ViewInstance, type ViewStyle } from 'react-native'
import { GestureDetector, type GestureType } from 'react-native-gesture-handler'
import { type AnimatedStyle } from 'react-native-reanimated'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { GlassIsland, usePageBlurTarget } from 'shared/ui'
import { useIsWideLayout, useLayoutBaseWidth, WIDE_MINI_PLAYER_MAX_WIDTH } from 'shared/ui/layout'
import { type ThemeColors } from 'shared/ui/theme'
import { miniPillColumnStyle } from './commonStyles'
import { MiniDownloadProgress } from './MiniDownloadProgress'
import { MiniPlayerTrackInfo } from './MiniPlayerTrackInfo'
import { MiniPlayerTransport } from './MiniPlayerTransport'
import { MiniPlayerWideRow } from './MiniPlayerWideRow'
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
    // The pill floats over the page (search overlay included), never under it,
    // so it frosts the page target instead of the chrome's.
    const pageBlurTarget = usePageBlurTarget()
    // Wide windows move the transport cluster left of the artwork (Apple Music
    // order); phones keep the compact artwork/title/single-play row.
    const isWideLayout = useIsWideLayout()
    // The pill is positioned inside this natively centred column, and the wide
    // pill is SIZED on the same column (`getWideMiniPlayerGeometry`), so it can
    // never span outside its host: the touch bands beside the column stay alive.
    const columnMaxWidth = Math.min(useLayoutBaseWidth(), WIDE_MINI_PLAYER_MAX_WIDTH)

    return (
      <View pointerEvents='box-none' style={[miniPillColumnStyle, { maxWidth: columnMaxWidth }]}>
        <GestureDetector gesture={miniPan}>
          <GlassIsland
            ref={ref}
            onPress={onPress}
            isLight={isLight}
            blurTarget={pageBlurTarget}
            accessibilityRole={ROW_ACCESSIBILITY_ROLE}
            hostStyle={[
              miniStyles.miniContainer,
              // Wide geometry is pinned to the expanded pose, so the scroll-driven
              // collapse must only fold the compact pill's inset.
              !isWideLayout && barCollapsed && miniStyles.miniContainerCollapsed,
              isTucked && miniStyles.miniContainerTucked,
            ]}
            animatedStyle={[
              miniStyle,
              // Animated geometry wins at the NATIVE level. The React resting style
              // comes after it so the SHADOW TREE always carries the settled bar
              // geometry (#63); the transform-only tuckStyle follows last.
              miniBarStyle,
              miniBarRestingStyle,
              tuckStyle,
            ]}
          >
            {isWideLayout ? (
              <MiniPlayerWideRow audio={audio} playlist={playlist} miniStyles={miniStyles} />
            ) : (
              <>
                <MiniPlayerTrackInfo audio={audio} playlist={playlist} miniStyles={miniStyles} />
                <MiniPlayerTransport
                  playing={playing}
                  miniStyles={miniStyles}
                  onPlayPause={onPlayPause}
                  showSpinner={showSpinner}
                  currentTheme={currentTheme}
                />
              </>
            )}
            <MiniDownloadProgress miniStyles={miniStyles} audioUrl={audio.audioUrl} />
          </GlassIsland>
        </GestureDetector>
      </View>
    )
  },
)
MiniPlayer.displayName = 'MiniPlayer'
