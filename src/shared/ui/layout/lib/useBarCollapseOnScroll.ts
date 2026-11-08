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
//
// Callers whose content can change height above the viewport (a row mounting or
// unmounting while the list is scrolled) must also wire the returned
// `onContentSizeChange` to their scroll view: it marks the next offset change as
// layout-induced so it cannot be mistaken for a scroll gesture.
export const useBarCollapseOnScroll = ({ isSuspended = false }: { isSuspended?: boolean } = {}) => {
  const applyCollapsed = useAction(setBarCollapsed)
  const ctx = useCtx()
  const isSuspendedSv = useSharedValue(isSuspended)
  const wasCollapsedSv = useSharedValue(false)
  // Last offset the driver actually acted on. A layout/keyboard change can
  // replay onScroll at the unchanged offset right after an explicit expand
  // (tapping the collapsed circle); treating that replay as a fresh downward
  // crossing collapsed the bar before the user saw the expand.
  const lastOffsetSv = useSharedValue<null | number>(null)
  const contentHeightSv = useSharedValue<null | number>(null)
  // A content-size change (a row mounts/unmounts above the viewport) makes the
  // browser keep the visible content in place by shifting the scroll offset.
  // That offset shift arrives as a regular onScroll, so the first event after a
  // content change must only re-baseline the driver instead of crossing a
  // threshold — otherwise opening search while scrolled down re-collapses the
  // bar before the field is painted.
  const isLayoutShiftPendingSv = useSharedValue(false)

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

  const onContentSizeChange = (_contentWidth: number, contentHeight: number) => {
    const previousHeight = contentHeightSv.value
    contentHeightSv.value = contentHeight
    // Before the first scroll there is no offset to preserve, and the mount
    // measurement is not a layout change; arming here would swallow the first
    // real scroll gesture.
    if (lastOffsetSv.value === null) return
    if (previousHeight === null || previousHeight === contentHeight) return

    isLayoutShiftPendingSv.value = true
  }

  const onScroll = useAnimatedScrollHandler(event => {
    const offset = event.contentOffset.y
    // Only a changed offset is a scroll gesture; a replayed event at the same
    // offset must not flip the bar after an explicit expand.
    if (offset === lastOffsetSv.value) return
    lastOffsetSv.value = offset

    // The offset moved because the content above changed size, not because the
    // user scrolled: adopt the new baseline and wait for the next gesture.
    if (isLayoutShiftPendingSv.value) {
      isLayoutShiftPendingSv.value = false
      return
    }

    if (isSuspendedSv.value) return

    // Quantization: only a threshold crossing writes to the atom, so the
    // hysteresis band never re-schedules React work per scroll frame.
    const nextCollapsed = nextBarCollapsedState(offset, wasCollapsedSv.value)
    if (nextCollapsed === null) return

    wasCollapsedSv.set(nextCollapsed)
    scheduleOnRN(applyCollapsed, nextCollapsed)
  })

  return { onContentSizeChange, onScroll }
}
