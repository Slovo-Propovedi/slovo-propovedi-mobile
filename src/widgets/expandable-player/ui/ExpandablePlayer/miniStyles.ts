import { StyleSheet } from 'react-native'
import { createGlassStyles } from 'shared/ui'
import { BAR_CIRCLE_SIZE_EXPANDED } from 'shared/ui/layout'
import {
  FONT_SIZES,
  INDENTS,
  MIN_TOUCH_TARGET,
  PLAYER_SIZES,
  RADIUSES,
  type ThemeColors,
} from 'shared/ui/theme'

export const MINI_PILL_RADIUS = PLAYER_SIZES.miniPlayerHeight / 2
// Compact inset of the artwork (and of the transport in the collapsed bar): equal
// on both sides is what makes the collapsed pill read symmetric. Apple Music
// keeps generous air before the artwork and after the transport.
export const MINI_CONTENT_SIDE_INSET = INDENTS.medium
export const MINI_ARTWORK_SIZE = 40
// The transport occupies the same visual box as the artwork; hitSlop restores the
// ≥48dp touch target the icon needs.
const MINI_PLAY_BOX_SIZE = MINI_ARTWORK_SIZE
export const MINI_PLAY_HIT_SLOP = (MIN_TOUCH_TARGET - MINI_PLAY_BOX_SIZE) / 2
// The expanded pill spans the row content, so its right edge coincides with the
// search circle's right edge. Centring the transport glyph on that circle's axis
// means insetting it by the circle's half-width minus the transport's half-width:
// 76 / 2 − 40 / 2 = 18dp.
export const MINI_EXPANDED_TRANSPORT_RIGHT_INSET =
  BAR_CIRCLE_SIZE_EXPANDED / 2 - MINI_PLAY_BOX_SIZE / 2

export const createMiniStyles = (theme: ThemeColors, isLight: boolean) => {
  const glass = createGlassStyles(isLight, MINI_PILL_RADIUS)

  return StyleSheet.create({
    downloadFill: {
      height: '100%',
    },
    downloadTrack: {
      backgroundColor: 'rgba(128, 128, 128, 0.4)',
      bottom: 0,
      height: 2,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    // Geometry (bottom/left/width/radius) is committed by the bar-morph styles in
    // MiniPlayer: animated during the morph, React-resting for the current state.
    miniContainer: {
      ...glass.container,
      alignItems: 'center',
      borderRadius: MINI_PILL_RADIUS,
      flexDirection: 'row',
      height: PLAYER_SIZES.miniPlayerHeight,
      overflow: 'hidden',
      paddingLeft: MINI_CONTENT_SIDE_INSET,
      paddingRight: MINI_EXPANDED_TRANSPORT_RIGHT_INSET,
      position: 'absolute',
      zIndex: 300,
    },
    // The collapsed pill rests inside the row, away from the search circle, so
    // the generous expanded right inset collapses back to the artwork's inset.
    miniContainerCollapsed: {
      paddingRight: MINI_CONTENT_SIDE_INSET,
    },
    // No shadow while a morph resizes the pill (see `GlassSurface` degraded).
    miniContainerDegraded: glass.containerDegraded,
    miniControls: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      height: MINI_PLAY_BOX_SIZE,
      justifyContent: 'center',
      width: MINI_PLAY_BOX_SIZE,
    },
    miniCover: {
      borderRadius: RADIUSES.low,
      height: MINI_ARTWORK_SIZE,
      width: MINI_ARTWORK_SIZE,
    },
    miniOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.surface,
      borderRadius: MINI_PILL_RADIUS,
    },
    miniPlayButton: {
      height: MINI_PLAY_BOX_SIZE,
      minHeight: MINI_PLAY_BOX_SIZE,
      minWidth: MINI_PLAY_BOX_SIZE,
      width: MINI_PLAY_BOX_SIZE,
    },
    // Apple Music pill: the subtitle matches the title's size and color, dropping
    // only in weight (regular against semi-bold), so both lines read as one block.
    miniPlaylistName: {
      color: theme.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '400',
      marginTop: 2,
    },
    miniTextContainer: {
      flex: 1,
      justifyContent: 'center',
      marginLeft: INDENTS.low,
      marginRight: INDENTS.low,
      overflow: 'hidden',
    },
    miniTrackTitle: {
      color: theme.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
  })
}
