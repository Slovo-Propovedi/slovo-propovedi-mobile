import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'
import type { ThemeColors } from 'shared/ui/theme'

export const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      flex: 1,
    },
    contentSection: {
      backgroundColor: theme.background,
      paddingBottom: INDENTS.medium,
      paddingHorizontal: INDENTS.medium,
      paddingTop: INDENTS.medium,
    },
    description: {
      color: theme.textMuted,
      fontSize: FONT_SIZES.base,
      lineHeight: FONT_SIZES.base * 1.5,
      paddingHorizontal: INDENTS.medium,
      textAlign: 'center',
    },
    headerImage: {
      height: '100%',
      width: '100%',
    },
    headerImageContainer: {
      overflow: 'hidden',
    },
    listContentContainer: {
      backgroundColor: theme.background,
      paddingBottom: INDENTS.high,
    },
    listHeaderContainer: {
      backgroundColor: theme.background,
    },
    overlay: {
      backgroundColor: COLORS.black,
      bottom: 0,
      left: 0,
      opacity: 0.3,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    title: {
      color: COLORS.white,
      fontSize: FONT_SIZES.h1,
      fontWeight: '700',
      paddingHorizontal: INDENTS.medium,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { height: 2, width: 0 },
      textShadowRadius: 4,
    },
    titleContainer: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
  })

export const queueControlsStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: RADIUSES.round,
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: INDENTS.middle,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.middle,
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginLeft: INDENTS.low,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: INDENTS.middle,
  },
  icon: {
    tintColor: COLORS.onPrimary,
  },
})
