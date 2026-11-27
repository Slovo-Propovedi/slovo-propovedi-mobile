import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { isDomNode, settle } from './pull-to-refresh.dom'
import { attachPullGesture } from './pull-to-refresh.gesture'
import { TRIGGER_DISTANCE } from './pull-to-refresh.lib'
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
 * @param root0.onProgress - Receives the live 0..1 pull progress for the overlay.
 * @param root0.onRefresh - Reload callback fired when a pull passes the threshold.
 * @param root0.refreshing - Controlled spinner state owned by the parent.
 * @returns Refs for the wrapper/content/spinner plus the armed flag.
 */
export const usePullToRefreshGesture = ({
  onProgress,
  onRefresh,
  refreshing,
}: Pick<PullToRefreshProps, 'onRefresh' | 'refreshing'> & {
  onProgress: (progress: number) => void
}) => {
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
    // The overlay reads the same progress: full while the refresh is active,
    // otherwise back to zero (a cancelled pull sits at 0 already).
    onProgress(isActive ? 1 : 0)
    settle(
      contentNodeRef.current,
      spinnerNodeRef.current,
      isActive ? TRIGGER_DISTANCE : 0,
      isActive ? 1 : 0,
    )
  }, [isPending, onProgress, refreshing, wrapperNode])

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
      onProgress,
      onRefresh: onRefreshRef,
      spinner: spinnerNodeRef,
    })
  }, [onProgress, wrapperNode])

  return { contentRef, isArmed: isArmed || refreshing, spinnerRef, wrapperRef }
}
