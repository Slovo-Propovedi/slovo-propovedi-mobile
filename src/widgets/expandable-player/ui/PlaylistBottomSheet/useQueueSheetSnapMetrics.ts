import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Geometry rationale for the queue sheet:
//
// Two detents — 70% and full-height (H − topInset):
//   • 70% snap: the list frame covers 70% of the window; content that extends
//     below the sheet's bottom edge is clipped. The clipped height equals
//     0.3·H − topInset (≈270px on a 915px-tall screen with 59px inset).
//     The useScrollGuarantee footer compensates by growing an extra
//     hiddenBelowSheetEdge px so the last row scrolls above the clip edge.
//   • Full-height snap: the sheet reaches the physical screen bottom (nav /
//     gesture bar area), so hiddenBelowSheetEdge = 0.
//
// FINAL_SNAP_INDEX = 0 ⇒ the sheet opens at the 70% detent (full-height is index 1).
export const FINAL_SNAP_INDEX = 0

interface UseQueueSheetSnapMetricsParams {
  sheetIndex: number
}

export const useQueueSheetSnapMetrics = ({ sheetIndex }: UseQueueSheetSnapMetricsParams) => {
  const { height: windowHeight } = useWindowDimensions()
  const { top: topInset } = useSafeAreaInsets()

  // Height of list content hidden below the sheet's bottom edge at the 70% snap:
  // fullSheet − 0.7·window = 0.3·window − topInset (0 at the full-height snap).
  const hiddenBelowSheetEdge =
    sheetIndex === FINAL_SNAP_INDEX ? Math.max(0, 0.3 * windowHeight - topInset) : 0

  // Numeric detent = full window minus top safe-area only ⇒ sheet's bottom edge
  // reaches the physical screen bottom, so the list is visible under the nav /
  // gesture bar. The last row clears it via the 84px footer guarantee: at max
  // scroll offset the last row bottom sits `footerHeight` px above the list's
  // bottom edge.
  const snapPoints = useMemo(
    () => ['70%', windowHeight - topInset] as (number | string)[],
    [topInset, windowHeight],
  )

  return { hiddenBelowSheetEdge, snapPoints }
}
