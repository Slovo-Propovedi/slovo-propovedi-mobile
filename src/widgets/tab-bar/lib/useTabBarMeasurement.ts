import { useAction } from '@reatom/npm-react'
import { useLayoutEffect } from 'react'
import { type LayoutChangeEvent } from 'react-native'
import {
  BAR_ROW_MIN_HEIGHT,
  setTabBarHeight,
  useBarBottomPadding,
  useIsWideLayout,
  WIDE_BAR_ROW_HEIGHT,
} from 'shared/ui/layout'

/**
 * Publishes the floating tab row's height and returns the row's bottom padding.
 *
 * The height is DERIVED, not measured: the row is a fixed content box
 * (`BAR_ROW_MIN_HEIGHT`, or `WIDE_BAR_ROW_HEIGHT` in the wide layout) plus the
 * chrome's bottom padding, so it lands in the same commit as the row padding.
 * An onLayout hop used to fire twice on Android (a late safe-area inset grew the
 * padding after the first pass), settling the circle, the pill and every
 * screen's bottom padding in two visible steps.
 *
 * `onLayout` stays only as a floor guard: a real layout pass may report a
 * TALLER row (e.g. A future fixed header inside it), while a zero/short report
 * is not a measurement and is ignored.
 */
export const useTabBarMeasurement = () => {
  const bottomPadding = useBarBottomPadding()
  const isWide = useIsWideLayout()
  const derivedHeight = (isWide ? WIDE_BAR_ROW_HEIGHT : BAR_ROW_MIN_HEIGHT) + bottomPadding
  const publishTabBarHeight = useAction(setTabBarHeight)

  useLayoutEffect(() => {
    publishTabBarHeight(derivedHeight)
  }, [derivedHeight, publishTabBarHeight])

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout

    if (height <= derivedHeight) return

    publishTabBarHeight(height)
  }

  return { bottomPadding, onLayout }
}
