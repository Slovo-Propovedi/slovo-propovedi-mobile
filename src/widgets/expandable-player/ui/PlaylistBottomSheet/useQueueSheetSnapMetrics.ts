import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FINAL_SNAP_INDEX, useSheetSnapMetrics } from '../../lib/useSheetSnapMetrics'

interface UseQueueSheetSnapMetricsParams {
  sheetIndex: number
}

// Snap detents come from the shared sheet metrics; this wrapper only adds the
// playlist-specific per-snap sheet-top metric (see below).
export const useQueueSheetSnapMetrics = ({ sheetIndex }: UseQueueSheetSnapMetricsParams) => {
  const { snapPoints } = useSheetSnapMetrics()
  const { height: windowHeight } = useWindowDimensions()
  const { top: topInset } = useSafeAreaInsets()

  // Sheet-top position in screen coords per snap — drives the footer
  // recompute in useScrollGuarantee via the sheetTop prop.
  const sheetTop = sheetIndex === FINAL_SNAP_INDEX ? 0.3 * windowHeight : topInset

  return { sheetTop, snapPoints }
}
