import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { setBarCollapsed } from '../model'
import { nextBarCollapsedState } from './barCollapseScroll'

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

    // Quantization: only a threshold crossing writes to the atom, so the
    // hysteresis band never re-schedules React work per scroll frame.
    const nextCollapsed = nextBarCollapsedState(event.contentOffset.y, wasCollapsedSv.value)
    if (nextCollapsed === null) return

    wasCollapsedSv.value = nextCollapsed
    scheduleOnRN(applyCollapsed, nextCollapsed)
  })

  return { onScroll }
}
