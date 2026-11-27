import { StyleSheet } from 'react-native'
import { BAR_CIRCLE_SIZE_EXPANDED } from 'shared/ui/layout'
import {
  FONT_SIZES,
  INDENTS,
  MIN_TOUCH_TARGET,
  PLAYER_SIZES,
  RADIUSES,
  type ThemeColors,
} from 'shared/ui/theme'

// Compact inset of the artwork (and of the transport in the collapsed bar): equal
// on both sides is what makes the collapsed pill read symmetric. Apple Music
// keeps generous air before the artwork and after the transport.
export const MINI_CONTENT_SIDE_INSET = INDENTS.medium
export const MINI_ARTWORK_SIZE = 36
// The wide pill is taller (60), so its artwork grows with it and keeps the same
// generous air instead of looking sparse inside the roomier glass.
export const MINI_WIDE_ARTWORK_SIZE = 44
// The transport occupies the same visual box as the artwork; hitSlop restores the
// ≥48dp touch target the icon needs.
const MINI_PLAY_BOX_SIZE = MINI_ARTWORK_SIZE
export const MINI_PLAY_HIT_SLOP = (MIN_TOUCH_TARGET - MINI_PLAY_BOX_SIZE) / 2
// The expanded pill spans the row content, so its right edge coincides with the
// search circle's right edge. Centring the transport glyph on that circle's axis
// means insetting it by the circle's half-width minus the transport's half-width:
// 60 / 2 − 36 / 2 = 12dp.
export const MINI_EXPANDED_TRANSPORT_RIGHT_INSET =
  BAR_CIRCLE_SIZE_EXPANDED / 2 - MINI_PLAY_BOX_SIZE / 2
// Gap between the wide row's control clusters: tight enough that the row reads
// as one toolbar, wide enough to keep the 36dp visual boxes distinct.
export const MINI_WIDE_CONTROL_GAP = INDENTS.lowest

export const createMiniStyles = (theme: ThemeColors, isWideLayout = false) => {
  const artworkSize = isWideLayout ? MINI_WIDE_ARTWORK_SIZE : MINI_ARTWORK_SIZE
  const pillHeight = isWideLayout
    ? PLAYER_SIZES.wideMiniPlayerHeight
    : PLAYER_SIZES.miniPlayerHeight

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
    // No own shadow: the glass reads as floating without one.
    miniContainer: {
      alignItems: 'center',
      borderRadius: RADIUSES.round,
      flexDirection: 'row',
      height: pillHeight,
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
    // Tucked under the search row, the pill must cast no shadow: any bleed would
    // visually connect it to the search pill and ✕ silhouettes.
    miniContainerTucked: {
      boxShadow: 'none',
      elevation: 0,
    },
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
      height: artworkSize,
      width: artworkSize,
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
      fontSize: FONT_SIZES.lg,
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
    // Artwork + two-line text block. The wide row interleaves the transport
    // around it, so both layouts share one flexible wrapper.
    miniTrackInfo: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
    },
    miniTrackTitle: {
      color: theme.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
    },
  })
}
