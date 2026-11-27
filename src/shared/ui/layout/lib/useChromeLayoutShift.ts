import { useEffect, useRef } from 'react'
import {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { BAR_MORPH_DURATION_MS } from '../bottomBarLayout'
import { useIsWideLayout } from './useIsWideLayout'

interface ChromeLayoutShiftOptions {
  /** Distance (dp) between the two anchors this surface travels between. */
  distance: number
  /**
   * Whether the wide anchor sits ABOVE the compact one: +1 the surface rises
   * into wide (tab bar), -1 it descends into wide (mini pill).
   */
  wideAnchorSign: -1 | 1
}

/**
 * Signed slide of a chrome surface from the anchor it just left toward the
 * anchor it entered. `progress` is 0 at the compact anchor and 1 at the wide
 * one; the sign makes the same progress a rise for the tab bar and a descent
 * for the mini pill. Pure and worklet-safe, so the value reverses itself when
 * the layout flips back.
 * @param isWideLayout - Whether the CURRENT layout is the wide one.
 * @param progress - Layout-shift progress (0 = compact anchor, 1 = wide anchor).
 * @param distance - Distance in dp between the two anchors.
 * @param wideAnchorSign - +1 when wide sits above compact, -1 when below.
 */
export const getChromeShiftTranslateY = (
  isWideLayout: boolean,
  progress: number,
  distance: number,
  wideAnchorSign: -1 | 1,
): number => {
  'worklet'
  const slide = (isWideLayout ? 1 - progress : -progress) * distance * wideAnchorSign

  // `+ 0` normalizes -0 (0 × a negative distance) to an exact zero.
  return slide + 0
}

/**
 * Animated slide between the compact and the wide chrome anchors.
 *
 * The progress is seeded at the layout's rest position, so the first mount
 * never animates, and only a real layout flip schedules a timing. Rapid flips
 * retarget the same shared value, exactly like any other Reanimated timing, and
 * the translateY is derived from the CURRENT layout, so each side's entry gets
 * the matching direction (up for the top-anchored tab bar, down for the bottom
 * mini pill).
 * @param options - Anchor distance and the wide anchor's vertical direction.
 * @param options.distance - Distance in dp between the two anchors.
 * @param options.wideAnchorSign - +1 when wide sits above compact, -1 when below.
 */
export const useChromeLayoutShift = ({ distance, wideAnchorSign }: ChromeLayoutShiftOptions) => {
  const isWideLayout = useIsWideLayout()
  const progress = useSharedValue(isWideLayout ? 1 : 0)
  const previousIsWideLayout = useRef(isWideLayout)

  useEffect(() => {
    if (previousIsWideLayout.current === isWideLayout) return

    previousIsWideLayout.current = isWideLayout
    progress.value = withTiming(isWideLayout ? 1 : 0, { duration: BAR_MORPH_DURATION_MS })
  }, [isWideLayout, progress])

  const translateY: SharedValue<number> = useDerivedValue(() =>
    getChromeShiftTranslateY(isWideLayout, progress.value, distance, wideAnchorSign),
  )
  const shiftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))

  return { shiftStyle, translateY }
}
