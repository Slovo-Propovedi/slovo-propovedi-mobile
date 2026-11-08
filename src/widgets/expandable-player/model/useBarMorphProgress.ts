import { useAtom } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { useAtomMorphProgress } from 'shared/lib/hooks/useAtomMorphProgress'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { isMiniPillCollapsedAtom } from '../model/barMorph'

/**
 * Shared 0→1 progress of the bottom-bar morph (0 = detached mini pill above the
 * row, 1 = pill inside the collapsed bottom line). The animation is owned by
 * the atom subscription in {@link useAtomMorphProgress}, so it starts in the
 * same tick as the bar state change instead of waiting for this component's
 * render/commit (Android: ~130 ms, a visible freeze before the morph).
 *
 * `settledCollapsed` lags the bar state until the morph lands: it is the state
 * the React shadow tree may commit resting geometry for. Committing the target
 * geometry on the flip itself paints the pill at its destination for a frame —
 * before Reanimated asserts the start-of-morph animated value — then the pill
 * snaps back and visibly morphs again (the one-frame search-open flash).
 *
 * A new flip immediately commits `settledCollapsed` to the START state of the
 * new animation (`!isTarget`), so an interrupted morph can never leave the flag
 * lagging behind: even if a completion callback is lost or delivered late, the
 * committed resting geometry matches where the new animation starts.
 * @returns The morph progress and the bar state it settled into.
 */
export const useBarMorphProgress = () => {
  const [isCollapsed] = useAtom(isMiniPillCollapsedAtom)
  const [settledCollapsed, setSettledCollapsed] = useState(isCollapsed)
  const handleStart = useCallback((isTarget: boolean) => {
    setSettledCollapsed(!isTarget)
  }, [])
  const handleSettled = useCallback((isTarget: boolean) => {
    setSettledCollapsed(isTarget)
  }, [])
  const progress = useAtomMorphProgress(
    isMiniPillCollapsedAtom,
    BAR_MORPH_DURATION_MS,
    handleSettled,
    handleStart,
  )

  return { progress, settledCollapsed }
}
