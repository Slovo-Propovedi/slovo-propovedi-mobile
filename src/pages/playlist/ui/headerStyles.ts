import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, type ThemeColors } from 'shared/ui/theme'
import { TITLE_TEXT_SHADOW } from './titleTextShadow'

export const createHeaderStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    blur: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
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
      ...TITLE_TEXT_SHADOW,
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
