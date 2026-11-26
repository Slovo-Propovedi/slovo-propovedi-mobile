import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, type ThemeColors } from 'shared/ui/theme'
import { MINI_ARTWORK_SIZE, MINI_WIDE_CONTROL_GAP } from './miniStyles'

// The wide pill's toolbar. Icons keep the compact 36dp visual box like the
// artwork/play button; hitSlop restores their 48dp touch target.
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
    transportCluster: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: MINI_WIDE_CONTROL_GAP,
    },
    // With the right cluster gone the transport cluster is the pill's last
    // content: the auto margin pins it to the right edge.
    transportClusterRight: {
      marginLeft: 'auto',
    },
  })
