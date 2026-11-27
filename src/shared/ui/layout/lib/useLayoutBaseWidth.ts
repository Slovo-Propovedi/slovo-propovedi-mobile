import { Platform, useWindowDimensions } from 'react-native'

/**
 * Width base of the floating chrome: the window's SHORT side.
 *
 * On a phone the short side is the portrait width in both orientations, so a
 * rotation changes no size at all — only the (native, instant) centring of the
 * chrome moves. The JS-derived chrome geometry therefore cannot lag the native
 * relayout during a system rotation: it is not resized in the first place.
 * Downstream the base is capped by the content column (`CONTENT_COLUMN_WIDTH`),
 * so tablets and desktop web keep the centred column, and a split-screen pane
 * is never wider than the pane itself.
 *
 * Real resizes (split-screen divider, window resize) still update it, because
 * the short side changes.
 *
 * Web is the exception: a desktop window has no "portrait" side to freeze —
 * the short side would narrow the phone-style column below the content cap
 * (1366x500 gave a 500 column instead of the intended 600). Web therefore
 * keeps the live width and the column cap does the narrowing.
 */
export const useLayoutBaseWidth = (): number => {
  const { height, width } = useWindowDimensions()

  return Platform.OS === 'web' ? width : Math.min(width, height)
}
