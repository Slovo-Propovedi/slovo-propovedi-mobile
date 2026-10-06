import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { isDomNode, settle } from './pull-to-refresh.dom'
import { attachPullGesture } from './pull-to-refresh.gesture'
import { SPINNER_SLOT_HEIGHT } from './pull-to-refresh.lib'
import { type PullToRefreshProps } from './pull-to-refresh.types'

/**
 * Web-only touch gesture powering `PullToRefresh`: drag the content down when
 * the underlying scroll container sits at the top, then release to refresh.
 *
 * The gesture mutates the content/spinner DOM styles directly (no re-render per
 * touch move); React state flips only when the arm/pending flags change.
 * `refreshing` is the source of truth for the resting spinner; a local pending
 * flag bridges the gap until the parent flips `refreshing` on.
 * @param root0 - Gesture options.
 * @param root0.onRefresh - Reload callback fired when a pull passes the threshold.
 * @param root0.refreshing - Controlled spinner state owned by the parent.
 * @returns Refs for the wrapper/content/spinner plus the armed flag.
 */
export const usePullToRefreshGesture = ({
  onRefresh,
  refreshing,
}: Pick<PullToRefreshProps, 'onRefresh' | 'refreshing'>) => {
  const [isArmed, setIsArmed] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [wrapperNode, setWrapperNode] = useState<HTMLElement | null>(null)

  const contentNodeRef = useRef<HTMLElement | null>(null)
  const spinnerNodeRef = useRef<HTMLElement | null>(null)
  const draggingRef = useRef(false)
  const displayedPullRef = useRef(0)
  const lastTriggerAtRef = useRef(0)
  const onRefreshRef = useRef(onRefresh)
  const activeRef = useRef(false)

  // Latest-ref pattern: event handlers read the current values without being
  // re-created (and without touching refs during render).
  useEffect(() => {
    onRefreshRef.current = onRefresh
    activeRef.current = refreshing || isPending
  })

  const wrapperRef = useCallback((instance: unknown) => {
    setWrapperNode(isDomNode(instance) ? instance : null)
  }, [])
  const contentRef = useCallback((instance: unknown) => {
    contentNodeRef.current = isDomNode(instance) ? instance : null
  }, [])
  const spinnerRef = useCallback((instance: unknown) => {
    spinnerNodeRef.current = isDomNode(instance) ? instance : null
  }, [])

  useEffect(() => {
    if (draggingRef.current) return

    const isActive = refreshing || isPending
    settle(
      contentNodeRef.current,
      spinnerNodeRef.current,
      isActive ? SPINNER_SLOT_HEIGHT : 0,
      isActive ? 1 : 0,
    )
  }, [isPending, refreshing, wrapperNode])

  useEffect(() => {
    if (Platform.OS !== 'web' || !wrapperNode) return

    return attachPullGesture(wrapperNode, {
      active: activeRef,
      content: contentNodeRef,
      displayedPull: displayedPullRef,
      dragging: draggingRef,
      lastTriggerAt: lastTriggerAtRef,
      onArm: setIsArmed,
      onPending: setIsPending,
      onRefresh: onRefreshRef,
      spinner: spinnerNodeRef,
    })
  }, [wrapperNode])

  return { contentRef, isArmed: isArmed || refreshing, spinnerRef, wrapperRef }
}
