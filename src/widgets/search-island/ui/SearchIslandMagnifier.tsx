import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './SearchIslandMorph.styles'

const MAGNIFIER_SIZE = 32

/**
 * The always-visible search glyph of the morphing search frame.
 *
 * It is a vector-font glyph, so it is rendered at its target size instead of
 * being scaled: a fixed 32px node scaled down into the pill slot overflowed the
 * slot and Android clipped the glyph against the pill bounds (a visible
 * crescent). The glyph keeps that size in every state; only its inset moves.
 */
export const SearchIslandMagnifier = () => {
  const { currentTheme } = useTheme()

  return (
    <View
      pointerEvents='none'
      style={[styles.magnifier, { height: MAGNIFIER_SIZE, width: MAGNIFIER_SIZE }]}
    >
      <Ionicons name='search' size={MAGNIFIER_SIZE} color={currentTheme.text} />
    </View>
  )
}
