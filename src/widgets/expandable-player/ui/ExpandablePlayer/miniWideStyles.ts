import { StyleSheet } from 'react-native'
import { FONT_SIZES, MIN_TOUCH_TARGET, type ThemeColors } from 'shared/ui/theme'
import { MINI_WIDE_ARTWORK_SIZE, MINI_WIDE_CONTROL_GAP } from './miniStyles'

// Shared glyph size of the right cluster (menu, text, burger): one size keeps
// the toolbar visually even.
export const MINI_WIDE_ICON_SIZE = FONT_SIZES.xl

// Prev/next glyphs sit between the base 20 and the 40 play/pause: ~70% of play
// keeps the three transport icons one family without the skip triangles
// dominating (feedback 2026-11-27).
export const WIDE_SKIP_GLYPH_SIZE = 28
// Repeat and favorite are the lighter edge actions: one shared glyph/box pair,
// a touch smaller than the heart's previous 20-in-44 (feedback 2026-11-27).
export const MINI_WIDE_ACTION_ICON_SIZE = 18
export const MINI_WIDE_ACTION_BOX_SIZE = 36
// The smaller visual box keeps a full touch target through hitSlop.
export const MINI_WIDE_ACTION_HIT_SLOP = (MIN_TOUCH_TARGET - MINI_WIDE_ACTION_BOX_SIZE) / 2

// prev/play/next each keep a 48dp touch box; the fixed three-button slot is what
// centres the transport between the repeat toggle and the heart.
const MINI_WIDE_TRANSPORT_WIDTH = MIN_TOUCH_TARGET * 3

// The wide pill's toolbar. Icons share the wider 48dp artwork box of the tall
// pill; hitSlop restores their 48dp touch target.
export const createWideMiniStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    actionButton: {
      height: MINI_WIDE_ACTION_BOX_SIZE,
      minHeight: MINI_WIDE_ACTION_BOX_SIZE,
      minWidth: MINI_WIDE_ACTION_BOX_SIZE,
      // Resets the repeat toggle's own padding so both edge actions match.
      padding: 0,
      width: MINI_WIDE_ACTION_BOX_SIZE,
    },
    controlsRow: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: MINI_WIDE_CONTROL_GAP,
    },
    icon: {
      color: theme.text,
    },
    iconButton: {
      height: MINI_WIDE_ARTWORK_SIZE,
      minHeight: MINI_WIDE_ARTWORK_SIZE,
      minWidth: MINI_WIDE_ARTWORK_SIZE,
      width: MINI_WIDE_ARTWORK_SIZE,
    },
    rightCluster: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: MINI_WIDE_CONTROL_GAP,
    },
    textButton: {
      alignItems: 'center',
      height: MINI_WIDE_ARTWORK_SIZE,
      justifyContent: 'center',
      minHeight: MINI_WIDE_ARTWORK_SIZE,
      minWidth: MINI_WIDE_ARTWORK_SIZE,
      opacity: 0.5,
      width: MINI_WIDE_ARTWORK_SIZE,
    },
    // Transport seams sit between touch boxes that centre their glyphs, so both
    // sides contribute glyph air; the artwork is flush with its own box. Without
    // this leading inset the heart→artwork seam loses the next-track glyph's
    // air and reads narrower than the heart→next seam (both gaps stay
    // MINI_WIDE_CONTROL_GAP).
    trackInfo: {
      marginLeft: (MIN_TOUCH_TARGET - WIDE_SKIP_GLYPH_SIZE) / 2,
    },
    transportCluster: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: MINI_WIDE_CONTROL_GAP,
    },
    // Fixed slot for the always-visible prev/play/next buttons.
    transportControls: {
      width: MINI_WIDE_TRANSPORT_WIDTH,
    },
  })
