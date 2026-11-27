import { useEffect, useRef, useState } from 'react'
import { useAnimatedStyle, useFrameCallback } from 'react-native-reanimated'
import { createAtomMorphClock } from 'shared/lib/hooks/atomMorphClock'
import { getResultsTransitionStyles, RESULTS_TRANSITION_DURATION_MS } from './resultsTransition'

/**
 * Drives the home ↔ results page morph off the same threshold that swaps the
 * page poses. The title and scope fold away while the category pills unfold
 * below the field; the field itself keeps its flow slot and slides up as the
 * blocks above it collapse.
 * @param isResults - Whether the query crossed the results threshold.
 */
export const useResultsTransition = (isResults: boolean) => {
  // Whether the results pose has finished settling. The lazy initializer runs
  // once, so a page mounted straight into results starts already settled.
  const [isResultsSettled, setResultsSettled] = useState(isResults)
  const [clock] = useState(() => {
    const created = createAtomMorphClock({
      durationMs: RESULTS_TRANSITION_DURATION_MS,
      onSettled: setResultsSettled,
    })
    created.snapTo(isResults ? 1 : 0)

    return created
  })
  const frameCallback = useFrameCallback(clock.frameStep, false)
  const previousResultsRef = useRef(isResults)

  useEffect(() => clock.attachFrameHost(frameCallback), [clock, frameCallback])

  useEffect(() => {
    if (previousResultsRef.current === isResults) return

    previousResultsRef.current = isResults
    clock.start(isResults ? 1 : 0)
  }, [clock, isResults])

  // The updaters close over the SharedValue directly: a plain container object
  // (the clock) is not a shared value, so Reanimated treats it as a React
  // dependency instead of a UI-thread input.
  const { progress } = clock
  const titleStyle = useAnimatedStyle(() => getResultsTransitionStyles(progress.value).title)
  const scopeStyle = useAnimatedStyle(() => getResultsTransitionStyles(progress.value).scope)
  const categoriesStyle = useAnimatedStyle(
    () => getResultsTransitionStyles(progress.value).categories,
  )

  return { categoriesStyle, isResultsSettled, scopeStyle, titleStyle }
}
