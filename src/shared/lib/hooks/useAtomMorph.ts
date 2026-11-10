import { type Atom } from '@reatom/framework'
import { useCtx } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { useAtomMorphProgress } from './useAtomMorphProgress'

/**
 * Morph progress of an atom-driven boolean, shared by every surface of one
 * transition.
 *
 * The animation stays owned by {@link useAtomMorphProgress}; this hook is the
 * surface-facing entry point and adds the settled lag. `settled` is the state
 * the React shadow tree may commit resting geometry for: it seeds from the atom
 * at mount, but a flip immediately commits the START of the new animation
 * (`!isTarget`) and only the animation completion commits the target. Committing
 * the target on the flip paints the destination for a frame before Reanimated
 * asserts the start-of-morph value, then snaps back and visibly morphs again
 * (the one-frame bar flash, Issue #63).
 *
 * A new flip owns the commit immediately, so an interrupted morph whose
 * completion is lost or delivered late can never commit a stale target.
 * @param targetAtom - Atom whose boolean value selects the target (false = 0, true = 1).
 * @param durationMs - Morph duration shared by every surface of one bar morph.
 */
export const useAtomMorph = (targetAtom: Atom<boolean>, durationMs: number) => {
  const ctx = useCtx()
  const [settled, setSettled] = useState(() => ctx.get(targetAtom))
  const handleStart = useCallback((isTarget: boolean) => setSettled(!isTarget), [])
  const handleSettled = useCallback((isTarget: boolean) => setSettled(isTarget), [])
  const progress = useAtomMorphProgress(targetAtom, durationMs, handleSettled, handleStart)

  return { progress, settled }
}
