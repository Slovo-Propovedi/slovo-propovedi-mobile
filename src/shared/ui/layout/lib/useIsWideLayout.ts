import { useWindowDimensions } from 'react-native'
import { WIDE_LAYOUT_MIN_WIDTH } from '../bottomBarLayout'

/**
 * True at tablet/desktop widths: the wide layout applies from
 * WIDE_LAYOUT_MIN_WIDTH (768) upward and the phone layout below it.
 */
export const useIsWideLayout = (): boolean => {
  const { width } = useWindowDimensions()

  return width >= WIDE_LAYOUT_MIN_WIDTH
}
