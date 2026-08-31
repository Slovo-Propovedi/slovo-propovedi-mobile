import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'
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
    hiddenContent: { opacity: 0 },
    indicator: { backgroundColor: themeColors.textMuted },
    listContent: {
      paddingBottom: INDENTS.medium,
      paddingHorizontal: INDENTS.medium,
    },
    listWrapper: { flex: 1 },
    skeletonArt: {
      borderRadius: RADIUSES.low,
      height: TRACK_LIST_ITEM_SIZES.albumArtSize,
      marginRight: INDENTS.middle,
      width: TRACK_LIST_ITEM_SIZES.albumArtSize,
    },
    skeletonBase: { backgroundColor: themeColors.skeleton },
    skeletonOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: themeColors.background,
      paddingHorizontal: INDENTS.medium,
    },
    skeletonRow: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: INDENTS.middle,
      paddingVertical: INDENTS.middle,
    },
    skeletonSubtitle: {
      borderRadius: RADIUSES.low,
      height: 12,
      marginTop: INDENTS.lowest,
      width: '40%',
    },
    skeletonTextColumn: {
      flex: 1,
      justifyContent: 'center',
    },
    skeletonTitle: {
      borderRadius: RADIUSES.low,
      height: 14,
      width: '60%',
    },
    title: {
      color: themeColors.text,
      fontSize: FONT_SIZES.h2,
      fontWeight: 'bold',
      paddingBottom: INDENTS.medium,
      paddingHorizontal: INDENTS.medium,
    },
  })
