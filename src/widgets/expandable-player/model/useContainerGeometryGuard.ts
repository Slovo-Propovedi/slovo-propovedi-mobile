import { useEffect, useRef } from 'react'
import type { LayoutChangeEvent } from 'react-native'

interface UseContainerGeometryGuardInput {
  /** Resting top the container should match (always collapsed geometry). */
  expectedTop: number
  /** Optional chained layout handler from the consumer. */
  onLayout?: (event: LayoutChangeEvent) => void
  /** Callback when mismatch detected (consumer forces animated-layer re-application). */
  onMismatch: () => void
}

const HEAL_TOLERANCE_DP = 1
const MAX_HEALS = 5
const VERIFY_WINDOW_MS = 15_000

/**
 * Layer 5 closed-feedback loop for Issue #63.
 *
 * After a cold start (for example, an Expo reload), Reanimated may silently re-assert
 * cached first-generation animated props on the container's native view ~3–5s
 * after the correct geometry is committed. The container gets pushed to a stale
 * y position (lower than resting by ~20dp), overlapping tab bar icons.
 * Guard expectation is ALWAYS pinned to the collapsed resting top — the #63
 * signature only exists in the mini state. During expand/collapse animations
 * y ≤ collapsedTop → diff ≤ 0 → no false positives by construction.
 * The 15s verification window counts from the first guarded onLayout (container
 * attach), not from hook mount. This covers late attach scenarios (for example,
 * a fresh install where the user plays at t=40s) and eliminates the
 * onLayout-before-effect race.
 * Cap (5 heals): if the bug persists beyond 5 corrections, something else is
 * wrong — we stop intervening to avoid infinite loops.
 * @param root0 - Guard configuration.
 * @param root0.expectedTop - Resting top the container should match (collapsed geometry).
 * @param root0.onLayout - Optional chained layout handler from the consumer.
 * @param root0.onMismatch - Callback when mismatch detected.
 */
export const useContainerGeometryGuard = ({
  expectedTop,
  onLayout,
  onMismatch,
}: UseContainerGeometryGuardInput) => {
  const attachedAtRef = useRef(0)
  const hasAttachedRef = useRef(false)
  const healsRef = useRef(0)

  const handleLayout = (event: LayoutChangeEvent) => {
    onLayout?.(event)

    // Lazy stamp: record attach time on first guarded onLayout.
    if (!hasAttachedRef.current) {
      hasAttachedRef.current = true
      attachedAtRef.current = Date.now()
    }

    const { y } = event.nativeEvent.layout

    // Cold-start-only: skip after verification window expires.
    if (Date.now() - attachedAtRef.current > VERIFY_WINDOW_MS) return

    // Bug signature: container measurably LOWER than resting (y > top + 1dp).
    // During animations/gestures y ≤ resting top — no false positives.
    if (y - expectedTop <= HEAL_TOLERANCE_DP) return

    // Already healed enough times — stop intervening.
    if (healsRef.current >= MAX_HEALS) return

    healsRef.current += 1

    console.warn('playerGeometryHeal', {
      attempt: healsRef.current,
      expectedTop,
      y,
    })

    onMismatch()
  }

  useEffect(() => {
    // Reset heals and attach stamp when expected top changes (e.g. two-phase
    // tab bar measurement) — fresh budget for new geometry.
    healsRef.current = 0
    hasAttachedRef.current = false
    attachedAtRef.current = 0
  }, [expectedTop])

  return { onLayout: handleLayout }
}
