import { reportError } from '../../model/error-dialog'
import { dragTo, isElementLike, settle, setTransition } from './pull-to-refresh.dom'
import {
  computeDisplayedPull,
  findVerticalScrollableAncestor,
  shouldTriggerRefresh,
  TRIGGER_DISTANCE,
} from './pull-to-refresh.lib'

interface PullGestureRefs {
  active: { current: boolean }
  content: { current: HTMLElement | null }
  displayedPull: { current: number }
  dragging: { current: boolean }
  lastTriggerAt: { current: number }
  onArm: (armed: boolean) => void
  onPending: (pending: boolean) => void
  onRefresh: { current: () => Promise<void> | void }
  spinner: { current: HTMLElement | null }
}

/**
 * Wires the touch gesture onto a web wrapper node and returns its cleanup.
 *
 * Pulling only starts when the nearest vertical scroll container sits at the
 * top; scrolling up (or a container already scrolled) leaves touches untouched.
 * @param node - Web wrapper element that receives the touch listeners.
 * @param refs - Mutable refs and state setters the gesture reads and updates.
 * @returns Cleanup that removes every listener.
 */
export const attachPullGesture = (node: HTMLElement, refs: PullGestureRefs) => {
  let scrollable: HTMLElement | null = null
  let startY = 0
  let tracking = false

  const touchY = (event: TouchEvent) => event.touches[0]?.pageY ?? 0

  const stopTracking = () => {
    tracking = false
    refs.dragging.current = false
    refs.displayedPull.current = 0
  }

  const handleStart = (event: TouchEvent) => {
    const target = event.target
    scrollable = findVerticalScrollableAncestor(
      isElementLike(target) ? target : null,
      element => window.getComputedStyle(element).overflowY,
    )
    tracking = scrollable !== null && scrollable.scrollTop <= 0
    if (!tracking) return

    startY = touchY(event)
    setTransition(refs.content.current, refs.spinner.current, 0)
  }

  const handleMove = (event: TouchEvent) => {
    if (!tracking || !scrollable) return
    if (scrollable.scrollTop > 0) {
      stopTracking()
      dragTo(refs.content.current, refs.spinner.current, 0, 0)
      return
    }

    const deltaY = touchY(event) - startY
    if (deltaY <= 0) {
      if (!refs.dragging.current) return
      refs.dragging.current = false
      refs.displayedPull.current = 0
      dragTo(refs.content.current, refs.spinner.current, 0, 0)
      return
    }

    refs.dragging.current = true
    const displayed = computeDisplayedPull(deltaY)
    refs.displayedPull.current = displayed
    dragTo(
      refs.content.current,
      refs.spinner.current,
      displayed,
      Math.min(displayed / TRIGGER_DISTANCE, 1),
    )
    refs.onArm(displayed >= TRIGGER_DISTANCE)
  }

  const handleEnd = (trigger: boolean) => {
    if (!refs.dragging.current) {
      stopTracking()
      return
    }

    const displayed = refs.displayedPull.current
    stopTracking()

    const canTrigger =
      trigger &&
      !refs.active.current &&
      shouldTriggerRefresh(displayed, Date.now() - refs.lastTriggerAt.current)
    if (!canTrigger) {
      refs.onArm(false)
      settle(refs.content.current, refs.spinner.current, 0, 0)
      return
    }

    refs.lastTriggerAt.current = Date.now()
    refs.onPending(true)
    settle(refs.content.current, refs.spinner.current, TRIGGER_DISTANCE, 1)
    void Promise.resolve()
      .then(() => refs.onRefresh.current())
      .catch(reportError)
      .finally(() => refs.onPending(false))
  }

  const handleTouchEnd = () => handleEnd(true)
  const handleTouchCancel = () => handleEnd(false)

  node.addEventListener('touchstart', handleStart)
  node.addEventListener('touchmove', handleMove)
  node.addEventListener('touchend', handleTouchEnd)
  node.addEventListener('touchcancel', handleTouchCancel)
  return () => {
    node.removeEventListener('touchstart', handleStart)
    node.removeEventListener('touchmove', handleMove)
    node.removeEventListener('touchend', handleTouchEnd)
    node.removeEventListener('touchcancel', handleTouchCancel)
  }
}
