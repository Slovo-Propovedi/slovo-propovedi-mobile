import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/ui/theme'
import type { ThemeColors } from 'shared/ui/theme'

export const createMiniStyles = (theme: ThemeColors) =>
  StyleSheet.create({
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
