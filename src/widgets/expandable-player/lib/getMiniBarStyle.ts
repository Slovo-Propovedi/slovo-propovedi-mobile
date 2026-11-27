import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

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
 * Worklet-safe: used directly by the pill's animated style.
 * @param input - Geometry inputs and morph progress.
 */
export const getMiniBarStyle = (input: MiniBarStyleInput) => {
  'worklet'
  const { bottom, height, left, radius, width } = getMiniPlayerGeometry(input)

  return { borderRadius: radius, bottom, height, left, width }
}
