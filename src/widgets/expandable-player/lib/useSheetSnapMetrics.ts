import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Geometry shared by the expandable-player bottom sheets (playlist queue,
// sound settings) — defined here so both sheets stay in lockstep:
//
// Two detents — 70% and full-height (H − topInset):
//   • 70% snap: sheet occupies the bottom 70% of the screen.
//   • Full-height snap: sheet reaches the physical screen bottom (top inset respected).
//
// FINAL_SNAP_INDEX = 0 ⇒ a sheet opens at the 70% detent (full-height is index 1).
export const FINAL_SNAP_INDEX = 0

/**
 * Safe-area-aware snap detents for the player's bottom sheets.
 * Memoized on [topInset, windowHeight] — recomputes only on rotation/inset changes.
 */
export const useSheetSnapMetrics = () => {
  const { height: windowHeight } = useWindowDimensions()
  const { top: topInset } = useSafeAreaInsets()

  const snapPoints = useMemo(
    () => ['70%', windowHeight - topInset] as (number | string)[],
    [topInset, windowHeight],
  )

  return { snapPoints }
}
