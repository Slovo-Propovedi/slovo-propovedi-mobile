import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native'

/**
 * Additive bottom inset: returns `style` with `paddingBottom` raised by
 * `bottomInset`, preserving every other declaration the caller passed. Used by
 * scroll containers and footers on screens that sit under the transparent
 * system navbar so their content never hides below the home indicator.
 *
 * Non-numeric `paddingBottom` (e.g. `'auto'`) is treated as absent — the inset
 * itself still applies.
 * @param style - Base container style (registered style, array or plain object).
 * @param bottomInset - Bottom safe-area inset to add, in points.
 */
export const withBottomInset = (
  style: StyleProp<ViewStyle>,
  bottomInset: number,
): StyleProp<ViewStyle> => {
  const bottomPadding = StyleSheet.flatten(style)?.paddingBottom

  return [
    style,
    { paddingBottom: (typeof bottomPadding === 'number' ? bottomPadding : 0) + bottomInset },
  ]
}
