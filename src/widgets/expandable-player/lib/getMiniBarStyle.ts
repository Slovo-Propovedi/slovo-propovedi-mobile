import { getMiniPlayerGeometry } from './getMiniPlayerGeometry'

interface MiniBarStyleInput {
  barProgress: number
  fullScreenHeight: number
  screenWidth: number
  tabBarHeight: number
}

/**
 * Position style for the mini-player pill, mirroring the container's resting
 * geometry so both layers stay aligned through the bar morph.
 * Worklet-safe: used directly by the pill's animated style.
 * @param input - Geometry inputs and morph progress.
 */
export const getMiniBarStyle = (input: MiniBarStyleInput) => {
  'worklet'
  const { bottom, left, radius, width } = getMiniPlayerGeometry(input)

  return { borderRadius: radius, bottom, left, width }
}
