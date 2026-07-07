import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'
import type { ThemeColors } from 'shared/ui/theme'

export const TRACK_LIST_ITEM_SIZES = {
  albumArtSize: 50,
  leftOffset: 60,
} as const

export const createTracksListStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    albumArt: {
      borderRadius: RADIUSES.low,
      height: TRACK_LIST_ITEM_SIZES.albumArtSize,
      width: TRACK_LIST_ITEM_SIZES.albumArtSize,
    },
    albumArtContainer: {
      marginRight: INDENTS.middle,
      position: 'relative',
    },
    albumArtPlaying: {
      opacity: 0.6,
    },
    artist: {
      color: theme.textMuted,
      fontSize: FONT_SIZES.base,
      marginTop: INDENTS.lowest,
    },
    cacheIconContainer: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 12,
      bottom: 4,
      height: 24,
      justifyContent: 'center',
      position: 'absolute',
      right: 4,
      width: 24,
    },
    container: {
      backgroundColor: theme.background,
      flex: 1,
    },
    contextMenuItem: {
      padding: INDENTS.medium,
    },
    contextMenuItemText: {
      color: theme.text,
      fontSize: FONT_SIZES.base,
    },
    divider: {
      backgroundColor: theme.surface,
      height: 1,
      marginLeft: TRACK_LIST_ITEM_SIZES.leftOffset,
      marginVertical: INDENTS.low,
    },
    dotsButton: {
      padding: INDENTS.low,
    },
    dropdownMenu: {
      backgroundColor: theme.surface,
      borderRadius: RADIUSES.middle,
      elevation: 101,
      position: 'absolute',
      shadowOpacity: 0.25,
      shadowRadius: 8,
      zIndex: 101,
    },
    itemContainer: {
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: RADIUSES.middle,
      flexDirection: 'row',
      paddingHorizontal: INDENTS.middle,
      paddingVertical: INDENTS.middle,
    },
    itemContainerActive: {
      zIndex: 100,
    },
    playOrSoundBarsIconContainer: {
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      borderRadius: 12,
      bottom: 4,
      height: 24,
      justifyContent: 'center',
      position: 'absolute',
      right: 4,
      width: 24,
    },
    progressBarBackground: {
      borderRadius: 1.5,
      bottom: 0,
      height: 3,
      left: 0,
      overflow: 'hidden',
      position: 'absolute',
      right: 0,
    },
    progressBarFill: {
      backgroundColor: COLORS.primary,
      height: '100%',
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      color: theme.text,
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    titlePlaying: {
      color: COLORS.primary,
    },
  })
