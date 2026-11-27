import { getMiniPillColumnInset, getMiniPlayerGeometry } from './getMiniPlayerGeometry'

interface MiniBarStyleInput {
  barProgress: number
  /** Chrome content width the pill is sized from; defaults to `screenWidth`. */
  contentWidth?: number
  fullScreenHeight: number
  isWideLayout?: boolean
  screenWidth: number
  tabBarHeight: number
  wideBottomInset: number
}

/**
 * Position style for the mini-player pill, mirroring the container's resting
 * geometry so both layers stay aligned through the bar morph.
 *
 * The pill's absolute host lives inside a natively centred, full-width column
 * (`MiniPlayer`), so the style carries the offset INSIDE that column (`right`),
 * never the live window's centring inset: a rotation re-centres the column in
 * the same frame as the island row instead of leaving the pill on a stale
 * JS-computed `left`. The full-screen container stays screen-relative.
 * Worklet-safe: used directly by the pill's animated style.
 * @param input - Geometry inputs and morph progress.
 */
export const getMiniBarStyle = (input: MiniBarStyleInput) => {
  'worklet'
  const { bottom, height, left, radius, width } = getMiniPlayerGeometry(input)
  const columnInset = getMiniPillColumnInset(input.screenWidth, input.contentWidth)

  return { borderRadius: radius, bottom, height, right: left - columnInset, width }
}
