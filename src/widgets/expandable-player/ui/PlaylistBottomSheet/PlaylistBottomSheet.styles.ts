import { StyleSheet } from 'react-native'
import { TRACK_LIST_ITEM_SIZES } from 'entities/track-list'
import { FONT_SIZES, INDENTS, type ThemeColors } from 'shared/ui/theme'

export const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    background: { backgroundColor: themeColors.background },
    divider: {
      backgroundColor: themeColors.surface,
      height: 1,
      marginLeft: TRACK_LIST_ITEM_SIZES.leftOffset,
      marginVertical: INDENTS.low,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingBottom: INDENTS.medium,
      paddingLeft: INDENTS.medium,
      paddingRight: INDENTS.low,
    },
    hiddenContent: { opacity: 0 },
    indicator: { backgroundColor: themeColors.textMuted },
    listContent: {
      paddingBottom: INDENTS.medium,
      paddingHorizontal: INDENTS.medium,
    },
    listWrapper: { flex: 1 },
    skeletonOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: themeColors.background,
      paddingHorizontal: INDENTS.medium,
    },
    title: {
      color: themeColors.text,
      flex: 1,
      fontSize: FONT_SIZES.h2,
      fontWeight: 'bold',
    },
  })
