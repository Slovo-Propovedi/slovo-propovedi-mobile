import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { COLLAPSE_SCROLL_THRESHOLD, EXPAND_TOP_THRESHOLD } from '../bottomBarLayout'
import { setBarCollapsed } from '../model'

// Drives the floating bottom bar's collapsed state from a scroll offset.
//
// `isSuspended` pauses tracking while another surface owns the screen (search
// open, player expanded). Shared code cannot import feature/entity atoms (FSD),
// so callers pass the snapshot flag; it is mirrored into a shared value so the
// scroll worklet only ever reads UI-thread data.
export const useBarCollapseOnScroll = ({ isSuspended = false }: { isSuspended?: boolean } = {}) => {
  const applyCollapsed = useAction(setBarCollapsed)
  const isSuspendedSv = useSharedValue(isSuspended)
  const wasCollapsedSv = useSharedValue(false)

  useEffect(() => {
    isSuspendedSv.value = isSuspended
  }, [isSuspended, isSuspendedSv])

  const onScroll = useAnimatedScrollHandler(event => {
    if (isSuspendedSv.value) return

    const offsetY = event.contentOffset.y
    let shouldCollapse = wasCollapsedSv.value
    if (offsetY > COLLAPSE_SCROLL_THRESHOLD) shouldCollapse = true
    else if (offsetY <= EXPAND_TOP_THRESHOLD) shouldCollapse = false

    // Quantization: only a threshold crossing writes to the atom, so the
    // hysteresis band never re-schedules React work per scroll frame.
    if (shouldCollapse === wasCollapsedSv.value) return

    wasCollapsedSv.value = shouldCollapse
    scheduleOnRN(applyCollapsed, shouldCollapse)
  })

  return { onScroll }
}
