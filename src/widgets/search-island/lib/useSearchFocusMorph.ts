import { useCallback, useEffect, useState } from 'react'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

/**
 * Focus morph of the search pill's external close circle.
 *
 * `settledClose` lags `isFocused` until the fade lands: it seeds at 0 (hidden)
 * and a focus change commits the START of the new fade (`previousIsFocused`) in
 * the same React commit as the live flag, then the completion commits the
 * target. Committing the target on the change paints the circle at its
 * destination for a frame before Reanimated asserts the start value, then it
 * snaps back (Issue #63). One handler carries both flags so the start commit and
 * the flip land in one commit.
 */
export const useSearchFocusMorph = () => {
  const [isFocused, setIsFocused] = useState(false)
  const [settledClose, setSettledClose] = useState(false)
  const closeProgress = useSharedValue(isFocused ? 1 : 0)

  const handleCloseFocusChange = useCallback(
    (nextIsFocused: boolean) => {
      // A redundant focus event must not interrupt a settle that is in flight:
      // committing the START value now would desync `settledClose` until the
      // completion of the running fade corrects it on the next flip.
      if (nextIsFocused === isFocused) return

      setSettledClose(isFocused)
      setIsFocused(nextIsFocused)
    },
    [isFocused],
  )

  useEffect(() => {
    closeProgress.value = withTiming(
      isFocused ? 1 : 0,
      { duration: BAR_MORPH_DURATION_MS },
      finished => {
        // Reanimated v4 completion callbacks are worklets: bridge the setter to
        // the JS thread instead of calling React state directly.
        if (finished) scheduleOnRN(setSettledClose, isFocused)
      },
    )
  }, [closeProgress, isFocused])

  return { closeProgress, handleCloseFocusChange, isFocused, settledClose }
}
