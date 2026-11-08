import { useEffect, useRef } from 'react'
import { type LayoutChangeEvent } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'

interface UseContainerGeometryGuardInput {
  /** Resting top of the mini pill while the bar is collapsed into one row (progress 1). */
  barCollapsedTop: number
  /** Resting top of the detached mini pill while the bar is expanded (progress 0). */
  barExpandedTop: number
  /**
   * Live bar morph progress (0 = detached pill, 1 = collapsed bottom row).
   * The guard derives its expectation from this value AT REST, so it can never
   * lag behind the geometry the pill actually settled into.
   */
  barProgress: SharedValue<number>
  /** Optional chained layout handler from the consumer. */
  onLayout?: (event: LayoutChangeEvent) => void
  /** Callback when mismatch detected (consumer forces animated-layer re-application). */
  onMismatch: () => void
}

const HEAL_TOLERANCE_DP = 1
const MAX_HEALS = 5
const REST_EPSILON = 0.01
const VERIFY_WINDOW_MS = 15_000

const resolveRestingTop = (
  barProgress: number,
  barExpandedTop: number,
  barCollapsedTop: number,
): null | number => {
  if (Math.abs(barProgress) <= REST_EPSILON) return barExpandedTop
  if (Math.abs(barProgress - 1) <= REST_EPSILON) return barCollapsedTop
  return null
}

/**
 * Layer 5 closed-feedback loop for Issue #63.
 *
 * After a cold start (for example, an Expo reload), Reanimated may silently re-assert
 * cached first-generation animated props on the container's native view ~3–5s
 * after the correct geometry is committed. The container gets pushed to a stale
 * y position (lower than resting by ~20dp), overlapping tab bar icons.
 *
 * The expectation is derived from the bar morph progress shared value AT REST:
 * 0 → detached-pill top, 1 → collapsed-row top. A separately tracked "settled"
 * boolean could desync from the live animation (a completion callback delivered
 * after a newer flip), which made the guard "heal" an actually-correct layout
 * toward the wrong resting top. Between the two rest points the guard evaluates
 * nothing: the container is moving by design, so mid-morph violations are
 * ignored, not queued. The 15s verification window counts from the first guarded onLayout (container
 * attach), not from hook mount. This covers late attach scenarios (for example,
 * a fresh install where the user plays at t=40s) and eliminates the
 * onLayout-before-effect race.
 * Cap (5 heals): if the bug persists beyond 5 corrections, something else is
 * wrong — we stop intervening to avoid infinite loops. The warning is emitted
 * at most once per session: it is a prod signal of recurrence, not a per-frame
 * log.
 * @param root0 - Guard configuration.
 * @param root0.barCollapsedTop - Resting top when the bar is collapsed to one row.
 * @param root0.barExpandedTop - Resting top when the bar is expanded (detached pill).
 * @param root0.barProgress - Live bar morph progress shared value.
 * @param root0.onLayout - Optional chained layout handler from the consumer.
 * @param root0.onMismatch - Callback when mismatch detected.
 */
export const useContainerGeometryGuard = ({
  barCollapsedTop,
  barExpandedTop,
  barProgress,
  onLayout,
  onMismatch,
}: UseContainerGeometryGuardInput) => {
  const attachedAtRef = useRef(0)
  const hasAttachedRef = useRef(false)
  const healsRef = useRef(0)
  const hasWarnedRef = useRef(false)

  const handleLayout = (event: LayoutChangeEvent) => {
    onLayout?.(event)

    // Lazy stamp: record attach time on first guarded onLayout.
    if (!hasAttachedRef.current) {
      hasAttachedRef.current = true
      attachedAtRef.current = Date.now()
    }

    // Mid-morph the container is between the two resting positions by design,
    // so every frame would look like a mismatch.
    const expectedTop = resolveRestingTop(barProgress.value, barExpandedTop, barCollapsedTop)

    if (expectedTop === null) return

    // Cold-start-only: skip after verification window expires.
    if (Date.now() - attachedAtRef.current > VERIFY_WINDOW_MS) return

    // Bug signature: container measurably LOWER than resting (y > top + 1dp).
    if (event.nativeEvent.layout.y - expectedTop <= HEAL_TOLERANCE_DP) return

    // Already healed enough times — stop intervening.
    if (healsRef.current >= MAX_HEALS) return

    healsRef.current += 1

    // One warning per session is enough to flag a prod recurrence; repeated
    // warns from every morph frame drowned the console in noise.
    if (__DEV__ && !hasWarnedRef.current) {
      hasWarnedRef.current = true
      console.warn('playerGeometryHeal', {
        attempt: healsRef.current,
        expectedTop,
        y: event.nativeEvent.layout.y,
      })
    }

    onMismatch()
  }

  useEffect(() => {
    // Reset heals and attach stamp when the resting tops change (e.g. two-phase
    // tab bar measurement) — fresh budget for new geometry. The warning flag
    // is session-wide and intentionally survives the reset.
    healsRef.current = 0
    hasAttachedRef.current = false
    attachedAtRef.current = 0
  }, [barCollapsedTop, barExpandedTop])

  return { onLayout: handleLayout }
}
