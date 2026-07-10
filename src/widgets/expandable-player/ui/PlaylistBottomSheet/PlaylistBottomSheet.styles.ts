import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS } from 'shared/ui/themed'
import { TRACK_LIST_ITEM_SIZES } from 'shared/ui/track-list'
import type { ThemeColors } from 'shared/ui/theme'

export const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    background: { backgroundColor: themeColors.background },
    divider: {
      backgroundColor: themeColors.surface,
      height: 1,
      marginLeft: TRACK_LIST_ITEM_SIZES.leftOffset,
      marginVertical: INDENTS.low,
    },
    indicator: { backgroundColor: themeColors.textMuted },
    listContent: { paddingBottom: INDENTS.medium, paddingHorizontal: INDENTS.medium },
    title: {
      color: themeColors.text,
      fontSize: FONT_SIZES.h2,
      fontWeight: 'bold',
      paddingBottom: INDENTS.medium,
      paddingHorizontal: INDENTS.medium,
    },
  })
