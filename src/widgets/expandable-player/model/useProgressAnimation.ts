import { useEffect, useRef } from 'react'
import { withTiming } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { COLLAPSE_DURATION_MS, EXPAND_DURATION_MS } from './expandDurations'

/**
 * Animates the expand progress shared value. On first mount assigns directly
 * (no withTiming) to force the shared value onto the UI thread and re-trigger
 * dependent worklets; subsequent expanded changes animate with the matching
 * duration.
 * @param expanded Whether the player is currently expanded.
 * @param progress The shared progress value to animate.
 */
export const useProgressAnimation = (expanded: boolean, progress: SharedValue<number>) => {
  const isFirstRunRef = useRef(true)

  // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in effect (withTiming assignment below)
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in effect (first-run direct assignment)
      progress.value = expanded ? 1 : 0
      return
    }
    progress.value = withTiming(expanded ? 1 : 0, {
      duration: expanded ? EXPAND_DURATION_MS : COLLAPSE_DURATION_MS,
    })
  }, [expanded, progress])
}
