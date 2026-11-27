import { WIDE_LAYOUT_MIN_SHORTEST_SIDE, WIDE_LAYOUT_MIN_WIDTH } from '../bottomBarLayout'

/**
 * The single wide-layout rule: tablet-class in BOTH dimensions. Worklet-safe so
 * the animated pill geometry can self-derive the layout from its window shared
 * values inside the worklet, reacting on the first frame after a flip instead of
 * waiting for a React re-render. `useIsWideLayout` calls it with the window
 * dimensions, so the hook and the worklets can never drift apart.
 *
 * Web caveat: the worklets feed the height channel as
 * `min(Dimensions.get('screen').height, viewportHeight)` (the fullscreen
 * geometry must not overshoot the viewport). That clamp is normally the viewport
 * height, but on exotic multi-monitor/zoom setups the display height can be
 * SHORTER than the viewport, so within ~one threshold step of the 600 gate the
 * worklet may pick the other layout for that frame; the React hook stays correct
 * and the next commit writes the real size back.
 * @param width - Window width.
 * @param height - Window (viewport) height.
 */
export const getIsWideLayoutSync = (width: number, height: number): boolean => {
  'worklet'

  return (
    Math.min(width, height) >= WIDE_LAYOUT_MIN_SHORTEST_SIDE &&
    Math.max(width, height) >= WIDE_LAYOUT_MIN_WIDTH
  )
}
