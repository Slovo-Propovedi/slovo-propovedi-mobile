import { useEffect, useRef } from 'react'
import { type LayoutChangeEvent } from 'react-native'

interface UseContainerGeometryGuardInput {
  /** Resting top the container should match (always collapsed geometry). */
  expectedTop: number
  /**
   * True once the bar morph has landed. While a morph is running the live top
   * is deliberately between the two resting positions, so it must not be judged.
   */
  isSettled: boolean
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
 * Guard expectation is ALWAYS pinned to the settled resting top — the #63
 * signature only exists in the mini state.
 *
 * The guard only judges SETTLED bar states (`isSettled`). While the bar morphs,
 * the container is moving between the detached and the collapsed resting tops
 * by design; a live onLayout mid-morph would look like drift on every frame and
 * used to trigger a heal + warning dozens of times per session. Mid-morph
 * violations are ignored, not queued.
 *
 * The 15s verification window counts from the first guarded onLayout (container
 * attach), not from hook mount. This covers late attach scenarios (for example,
 * a fresh install where the user plays at t=40s) and eliminates the
 * onLayout-before-effect race.
 * Cap (5 heals): if the bug persists beyond 5 corrections, something else is
 * wrong — we stop intervening to avoid infinite loops. The warning is emitted
 * at most once per session: it is a prod signal of recurrence, not a per-frame
 * log.
 * @param root0 - Guard configuration.
 * @param root0.expectedTop - Resting top the container should match (settled geometry).
 * @param root0.isSettled - Whether the bar morph has landed.
 * @param root0.onLayout - Optional chained layout handler from the consumer.
 * @param root0.onMismatch - Callback when mismatch detected.
 */
export const useContainerGeometryGuard = ({
  expectedTop,
  isSettled,
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
    if (!isSettled) return

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
    // Reset heals and attach stamp when expected top changes (e.g. two-phase
    // tab bar measurement) — fresh budget for new geometry. The warning flag
    // is session-wide and intentionally survives the reset.
    healsRef.current = 0
    hasAttachedRef.current = false
    attachedAtRef.current = 0
  }, [expectedTop])

  return { onLayout: handleLayout }
}
