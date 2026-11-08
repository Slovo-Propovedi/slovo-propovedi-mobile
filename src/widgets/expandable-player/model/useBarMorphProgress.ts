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
 * `isSettled` is false from the flip until a timing actually completes. A
 * geometry guard must not judge live layout mid-morph: every frame is between
 * the two resting positions by design. An interrupted morph never reports a
 * settle, so the flag stays false until a later animation lands.
 * @returns The morph progress, the bar state it settled into, and whether the
 * morph is currently settled.
 */
export const useBarMorphProgress = () => {
  const [isCollapsed] = useAtom(isMiniPillCollapsedAtom)
  const [settledCollapsed, setSettledCollapsed] = useState(isCollapsed)
  const [isSettled, setIsSettled] = useState(true)
  const handleStart = useCallback(() => {
    setIsSettled(false)
  }, [])
  const handleSettled = useCallback((isTarget: boolean) => {
    setSettledCollapsed(isTarget)
    setIsSettled(true)
  }, [])
  const progress = useAtomMorphProgress(
    isMiniPillCollapsedAtom,
    BAR_MORPH_DURATION_MS,
    handleSettled,
    handleStart,
  )

  return { isSettled, progress, settledCollapsed }
}
