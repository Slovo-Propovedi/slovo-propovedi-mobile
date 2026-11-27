import { useWindowDimensions } from 'react-native'

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
 */
export const useLayoutBaseWidth = (): number => {
  const { height, width } = useWindowDimensions()

  return Math.min(width, height)
}
