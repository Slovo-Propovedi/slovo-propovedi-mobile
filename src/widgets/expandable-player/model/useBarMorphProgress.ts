import { useEffect, useRef, useState } from 'react'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

/**
 * Shared 0→1 progress of the bottom-bar morph (0 = detached mini pill above the
 * row, 1 = pill inside the collapsed bottom line). Animates with the same
 * duration as the tab-bar island morph so both move in sync. The first render
 * assigns directly so a surface mounted already collapsed never animates in.
 *
 * `settledCollapsed` lags the bar state until the morph lands: it is the state
 * the React shadow tree may commit resting geometry for. Committing the target
 * geometry on the flip itself paints the pill at its destination for a frame —
 * before Reanimated asserts the start-of-morph animated value — then the pill
 * snaps back and visibly morphs again (the one-frame search-open flash).
 * @param isCollapsed - Whether the bottom bar is currently collapsed.
 */
export const useBarMorphProgress = (isCollapsed: boolean) => {
  const progress = useSharedValue(isCollapsed ? 1 : 0)
  const [settledCollapsed, setSettledCollapsed] = useState(isCollapsed)
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      progress.value = isCollapsed ? 1 : 0
      return
    }
    progress.value = withTiming(
      isCollapsed ? 1 : 0,
      { duration: BAR_MORPH_DURATION_MS },
      finished => {
        // An interrupted morph reports `finished: false` — the replacement
        // animation owns the commit, so a stale target never reaches the shadow tree.
        if (finished) scheduleOnRN(setSettledCollapsed, isCollapsed)
      },
    )
  }, [isCollapsed, progress])

  return { progress, settledCollapsed }
}
