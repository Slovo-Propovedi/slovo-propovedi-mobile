import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, type ThemeColors } from 'shared/ui/theme'

const CARD_ARTWORK_SIZE_RATIO = 0.25

// Card rows carry a large cover (as on the user playlist screen); the separator
// offset on that screen is derived from this size, so it must stay public. The
// caller supplies the layout base (`useLayoutBaseWidth`) so the size follows a
// real resize; reading the window at call time was not reactive.
export const getListItemCardArtworkSize = (baseWidth: number): number =>
  baseWidth * CARD_ARTWORK_SIZE_RATIO

// Cover size of the `surface` rows used across the admin section screens. Only
// `surfaceArtwork` below consumes it now: user-facing rows match the larger
// `getListItemCardArtworkSize()` instead.
const SURFACE_ARTWORK_SIZE = 56

export const createListItemBaseStyles = (theme: ThemeColors, baseWidth: number) => {
  const cardArtworkSize = getListItemCardArtworkSize(baseWidth)

  return StyleSheet.create({
    body: {
      flex: 1,
    },
    card: {
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: RADIUSES.middle,
      flexDirection: 'row',
      paddingHorizontal: INDENTS.medium,
      paddingVertical: INDENTS.medium,
    },
    cardArtwork: {
      borderRadius: RADIUSES.low,
      height: cardArtworkSize,
      width: cardArtworkSize,
    },
    cardBody: {
      flex: 1,
      justifyContent: 'center',
    },
    cardSubtitle: {
      color: theme.textMuted,
      fontSize: FONT_SIZES.md,
      marginTop: INDENTS.low,
    },
    cardTitle: {
      color: theme.text,
      fontSize: FONT_SIZES.h3,
      fontWeight: '600',
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: INDENTS.medium,
    },
    surface: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderColor: 'transparent',
      borderRadius: RADIUSES.middle,
      borderWidth: 1,
      flexDirection: 'row',
      gap: INDENTS.medium,
      marginBottom: INDENTS.medium,
      padding: INDENTS.medium,
    },
    surfaceArtwork: {
      backgroundColor: COLORS.disabled,
      borderRadius: RADIUSES.low,
      height: SURFACE_ARTWORK_SIZE,
      width: SURFACE_ARTWORK_SIZE,
    },
    surfaceSubtitle: {
      color: theme.textMuted,
      fontSize: FONT_SIZES.sm,
      marginTop: 2,
    },
    surfaceTitle: {
      color: theme.text,
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
    },
    texts: {
      flex: 1,
    },
  })
}
