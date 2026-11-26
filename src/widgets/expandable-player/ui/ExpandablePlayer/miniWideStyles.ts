import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, type ThemeColors } from 'shared/ui/theme'
import { MINI_ARTWORK_SIZE, MINI_WIDE_CONTROL_GAP, MINI_WIDE_TRANSPORT_WIDTH } from './miniStyles'

// The wide pill's toolbar. Icons keep the compact 36dp visual box like the
// artwork/play button; hitSlop restores their 48dp touch target.
export const createWideMiniStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    controlsRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: MINI_WIDE_CONTROL_GAP,
    },
    icon: {
      color: theme.text,
    },
    iconButton: {
      height: MINI_ARTWORK_SIZE,
      minHeight: MINI_ARTWORK_SIZE,
      minWidth: MINI_ARTWORK_SIZE,
      width: MINI_ARTWORK_SIZE,
    },
    rightCluster: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: MINI_WIDE_CONTROL_GAP,
    },
    textButton: {
      alignItems: 'center',
      height: MINI_ARTWORK_SIZE,
      justifyContent: 'center',
      opacity: 0.5,
      paddingHorizontal: INDENTS.low,
    },
    textButtonLabel: {
      color: theme.text,
      fontSize: FONT_SIZES.sm,
    },
    transport: {
      width: MINI_WIDE_TRANSPORT_WIDTH,
    },
  })
