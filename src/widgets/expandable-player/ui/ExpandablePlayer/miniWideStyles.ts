import { StyleSheet } from 'react-native'
import { FONT_SIZES, MIN_TOUCH_TARGET, type ThemeColors } from 'shared/ui/theme'
import { MINI_WIDE_ARTWORK_SIZE, MINI_WIDE_CONTROL_GAP } from './miniStyles'

// Shared glyph size of the right cluster (menu, text, burger) and the transport
// icons: one size keeps the toolbar visually even.
export const MINI_WIDE_ICON_SIZE = FONT_SIZES.xl

// prev/play/next each keep a 48dp touch box; the fixed three-button slot is what
// centres the transport between the repeat toggle and the heart.
const MINI_WIDE_TRANSPORT_WIDTH = MIN_TOUCH_TARGET * 3

// The wide pill's toolbar. Icons share the wider 44dp artwork box of the tall
// pill; hitSlop restores their 48dp touch target.
export const createWideMiniStyles = (theme: ThemeColors) =>
  StyleSheet.create({
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
