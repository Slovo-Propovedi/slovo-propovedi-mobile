import { useWindowDimensions } from 'react-native'
import { WIDE_LAYOUT_MIN_SHORTEST_SIDE, WIDE_LAYOUT_MIN_WIDTH } from '../bottomBarLayout'

/**
 * True at tablet/desktop windows: the wide layout needs a tablet-class shortest
 * side (600) as well as a tablet-class width (768), so a phone in landscape
 * (844×390) never enters the wide layout.
 */
export const useIsWideLayout = (): boolean => {
  const { height, width } = useWindowDimensions()

  return (
    Math.min(width, height) >= WIDE_LAYOUT_MIN_SHORTEST_SIDE &&
    Math.max(width, height) >= WIDE_LAYOUT_MIN_WIDTH
  )
}
