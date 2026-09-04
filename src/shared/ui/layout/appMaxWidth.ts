import { Platform } from 'react-native'

/**
 * On desktop-web the phone-style UI would stretch edge to edge. Chrome that is
 * meant to read as a floating bar — the tab bar, the collapsed mini player, and
 * the fullscreen player's controls — is capped to a centered column of this
 * width instead. `undefined` on native (and on narrow web) means "no cap".
 */
export const APP_MAX_CONTENT_WIDTH: number | undefined = Platform.OS === 'web' ? 600 : undefined

/**
 * Horizontal inset that centers an {@link APP_MAX_CONTENT_WIDTH} column inside a
 * viewport `screenWidth` wide. Returns `minInset` when there is no cap or the
 * viewport is already narrower than the cap, so callers stay unchanged on phones.
 * @param screenWidth - Current viewport width.
 * @param minInset - Inset to keep when the column is not narrower than the viewport.
 * @returns The left/right inset in px.
 */
export const getColumnSideInset = (screenWidth: number, minInset = 0): number => {
  'worklet'
  if (APP_MAX_CONTENT_WIDTH == null) return minInset
  return Math.max(minInset, (screenWidth - APP_MAX_CONTENT_WIDTH) / 2)
}
