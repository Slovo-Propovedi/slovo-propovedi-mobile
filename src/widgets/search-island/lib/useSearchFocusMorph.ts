import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import {
  isSearchFieldFocusedAtom,
  isSearchFocusActiveAtom,
  isSearchQueryActive,
  searchQueryAtom,
} from 'features/sermon-search/@x/barMorph'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

/**
 * Morph of the search pill's external close circle.
 *
 * The ✕ is shown while the field is focused OR the query is active, so losing
 * focus with a typed query keeps it on screen. `settledClose` lags the derived
 * target until the fade lands: a target flip commits the START of the new fade
 * in the same React commit as the live flag, then the completion commits the
 * target. Committing the target on the change paints the circle at its
 * destination for a frame before Reanimated asserts the start value, then it
 * snaps back (Issue #63). One handler carries both flags so the start commit and
 * the flip land in one commit.
 */
export const useSearchFocusMorph = () => {
  const setFocusedAtom = useAction(isSearchFieldFocusedAtom)
  const [query] = useAtom(searchQueryAtom)
  // The held focus keeps this morph's target at "focused", so a dialog that
  // blurs the field cannot fade the ✕ out and in again.
  const [isFocusActive] = useAtom(isSearchFocusActiveAtom)
  const [isFocused, setIsFocused] = useState(false)
  const hasActiveQuery = isSearchQueryActive(query)
  const shouldShowClose = isFocusActive || hasActiveQuery
  const [settledClose, setSettledClose] = useState(shouldShowClose)
  const closeProgress = useSharedValue(shouldShowClose ? 1 : 0)

  const handleCloseFocusChange = useCallback(
    (nextIsFocused: boolean) => {
      // The atom carries focus to the rest of the bottom bar (tab island, mini
      // player). Writing a repeated value is a no-op, so it goes before the
      // guard that protects an in-flight close fade.
      setFocusedAtom(nextIsFocused)

      // A redundant focus event must not interrupt a settle that is in flight:
      // committing the START value now would desync `settledClose` until the
      // completion of the running fade corrects it on the next flip.
      if (nextIsFocused === isFocused) return

      // Focus does not always flip the close target: an active query keeps the ✕
      // shown, so focusing must not reset the resting layer to hidden.
      const nextShouldShowClose = nextIsFocused || hasActiveQuery
      if (nextShouldShowClose !== shouldShowClose) setSettledClose(shouldShowClose)
      setIsFocused(nextIsFocused)
    },
    [hasActiveQuery, isFocused, setFocusedAtom, shouldShowClose],
  )

  useEffect(() => {
    if (shouldShowClose === settledClose) return

    closeProgress.value = withTiming(
      shouldShowClose ? 1 : 0,
      { duration: BAR_MORPH_DURATION_MS },
      finished => {
        // Reanimated v4 completion callbacks are worklets: bridge the setter to
        // the JS thread instead of calling React state directly.
        if (finished) scheduleOnRN(setSettledClose, shouldShowClose)
      },
    )
  }, [closeProgress, settledClose, shouldShowClose])

  return { closeProgress, handleCloseFocusChange, settledClose, shouldShowClose }
}
