import { StyleSheet } from 'react-native'
import { createGlassStyles } from 'shared/ui'
import {
  FONT_SIZES,
  INDENTS,
  MIN_TOUCH_TARGET,
  PLAYER_SIZES,
  RADIUSES,
  type ThemeColors,
} from 'shared/ui/theme'

export const MINI_PILL_RADIUS = PLAYER_SIZES.miniPlayerHeight / 2
// One inset shared by the artwork's left edge and the transport's right edge:
// equal on both sides is what makes the pill read symmetric.
export const MINI_CONTENT_SIDE_INSET = INDENTS.low
export const MINI_ARTWORK_SIZE = 40
// The transport occupies the same visual box as the artwork, so both sit at the
// same edge inset; hitSlop restores the ≥48dp touch target the icon needs.
const MINI_PLAY_BOX_SIZE = MINI_ARTWORK_SIZE
export const MINI_PLAY_HIT_SLOP = (MIN_TOUCH_TARGET - MINI_PLAY_BOX_SIZE) / 2

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
      paddingHorizontal: MINI_CONTENT_SIDE_INSET,
      position: 'absolute',
      zIndex: 300,
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
    miniPlaylistName: {
      color: theme.textMuted,
      fontSize: FONT_SIZES.sm,
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
      fontSize: FONT_SIZES.base,
    },
  })
}
