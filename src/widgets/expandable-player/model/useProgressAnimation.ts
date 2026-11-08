import { useCallback, useEffect, useRef, useState } from 'react'
import { type SharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { COLLAPSE_DURATION_MS, EXPAND_DURATION_MS } from './expandDurations'

/**
 * Animates the expand progress shared value. On first mount assigns directly
 * (no withTiming) to force the shared value onto the UI thread and re-trigger
 * dependent worklets; subsequent expanded changes animate with the matching
 * duration.
 *
 * `settledExpanded` is the state the progress last landed on, so it lags the
 * `expanded` prop until the 300/250 ms timing completes (see
 * `useBarMorphProgress.settledCollapsed` for the same contract on the bar). The
 * React resting geometry must be restated for the SETTLED state: committing the
 * destination on the flip paints the container/pill at the target a frame before
 * Reanimated asserts the start-of-morph value, then snaps them back — the native
 * collapse/expand flash.
 * @param expanded Whether the player is currently expanded.
 * @param progress The shared progress value to animate.
 */
export const useProgressAnimation = (expanded: boolean, progress: SharedValue<number>) => {
  const isFirstRunRef = useRef(true)
  const [settledExpanded, setSettledExpanded] = useState(expanded)

  // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in effect (withTiming assignment below)
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in effect (first-run direct assignment)
      progress.value = expanded ? 1 : 0
      return
    }
    progress.value = withTiming(
      expanded ? 1 : 0,
      { duration: expanded ? EXPAND_DURATION_MS : COLLAPSE_DURATION_MS },
      finished => {
        // An interrupted animation hands over to the replacement, which owns
        // the settle commit.
        if (finished) scheduleOnRN(setSettledExpanded, expanded)
      },
    )
  }, [expanded, progress])

  // A foreground snap cancels the timing and leaves progress at rest.
  const settleOnSnap = useCallback(() => setSettledExpanded(expanded), [expanded])

  return { settledExpanded, settleOnSnap }
}
