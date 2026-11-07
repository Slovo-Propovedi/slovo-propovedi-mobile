import { useAction, useCtx } from '@reatom/npm-react'
import { useEffect } from 'react'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { isBarCollapsedAtom, setBarCollapsed } from '../model'
import { nextBarCollapsedState } from './barCollapseScroll'

// Drives the floating bottom bar's collapsed state from a scroll offset.
//
// `isSuspended` pauses tracking while another surface owns the screen (search
// open, player expanded). Shared code cannot import feature/entity atoms (FSD),
// so callers pass the snapshot flag; it is mirrored into a shared value so the
// scroll worklet only ever reads UI-thread data.
export const useBarCollapseOnScroll = ({ isSuspended = false }: { isSuspended?: boolean } = {}) => {
  const applyCollapsed = useAction(setBarCollapsed)
  const ctx = useCtx()
  const isSuspendedSv = useSharedValue(isSuspended)
  const wasCollapsedSv = useSharedValue(false)

  useEffect(() => {
    isSuspendedSv.value = isSuspended
  }, [isSuspended, isSuspendedSv])

  // Mirror external atom changes (e.g. tapping the collapsed circle to expand)
  // into the worklet's snapshot. Without this the snapshot stays stale and the
  // next downward crossing looks like "already collapsed", so the bar never
  // re-collapses until a top-threshold crossing resets it.
  useEffect(
    () =>
      ctx.subscribe(isBarCollapsedAtom, isCollapsed => {
        wasCollapsedSv.set(isCollapsed)
      }),
    [ctx, wasCollapsedSv],
  )

  const onScroll = useAnimatedScrollHandler(event => {
    if (isSuspendedSv.value) return

    // Quantization: only a threshold crossing writes to the atom, so the
    // hysteresis band never re-schedules React work per scroll frame.
    const nextCollapsed = nextBarCollapsedState(event.contentOffset.y, wasCollapsedSv.value)
    if (nextCollapsed === null) return

    wasCollapsedSv.set(nextCollapsed)
    scheduleOnRN(applyCollapsed, nextCollapsed)
  })

  return { onScroll }
}
