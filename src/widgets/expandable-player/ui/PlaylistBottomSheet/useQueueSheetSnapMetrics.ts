import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Geometry rationale for the queue sheet:
//
// Two detents — 70% and full-height (H − topInset):
//   • 70% snap: sheetTop = 0.3·H (sheet occupies bottom 70% of screen).
//   • Full-height snap: sheetTop = topInset (sheet reaches physical screen bottom).
//
// FINAL_SNAP_INDEX = 0 ⇒ the sheet opens at the 70% detent (full-height is index 1).
export const FINAL_SNAP_INDEX = 0

interface UseQueueSheetSnapMetricsParams {
  sheetIndex: number
}

export const useQueueSheetSnapMetrics = ({ sheetIndex }: UseQueueSheetSnapMetricsParams) => {
  const { height: windowHeight } = useWindowDimensions()
  const { top: topInset } = useSafeAreaInsets()

  // Sheet-top position in screen coords per snap — drives the footer
  // recompute in useScrollGuarantee via the sheetTop prop.
  const sheetTop = sheetIndex === FINAL_SNAP_INDEX ? 0.3 * windowHeight : topInset

  const snapPoints = useMemo(
    () => ['70%', windowHeight - topInset] as (number | string)[],
    [topInset, windowHeight],
  )

  return { sheetTop, snapPoints }
}
