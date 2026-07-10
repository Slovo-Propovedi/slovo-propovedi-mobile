import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/ui/themed'
import type { ThemeColors } from 'shared/ui/theme'

export const createMiniStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    miniContainer: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: RADIUSES.middle,
      bottom: PLAYER_SIZES.tabBarHeight + INDENTS.low,
      flexDirection: 'row',
      height: PLAYER_SIZES.miniPlayerHeight,
      left: INDENTS.low,
      overflow: 'hidden',
      paddingHorizontal: INDENTS.low,
      position: 'absolute',
      right: INDENTS.low,
      zIndex: 300,
    },
    miniControls: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    miniCover: {
      borderRadius: RADIUSES.low,
      height: 40,
      width: 40,
    },
    miniOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.surface,
      borderRadius: RADIUSES.middle,
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
