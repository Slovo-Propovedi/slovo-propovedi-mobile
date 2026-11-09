import { type Atom } from '@reatom/framework'
import { useCallback, useState } from 'react'
import { useAtomMorphProgress } from './useAtomMorphProgress'

type SettleHandler = (isTarget: boolean) => void

/**
 * Morph progress plus the React-visible lifecycle flag of the same timing.
 *
 * `isMorphing` flips in the atom subscription (the morph start) and clears from
 * the timing completion, so a surface can drop heavy layers (native backdrop
 * blur, shadow) for the duration of the morph and restore them once it settles.
 * The animation stays owned by {@link useAtomMorphProgress}; this hook only
 * mirrors its lifecycle and never starts a second timing.
 * @param targetAtom - Atom whose boolean value selects the target (false = 0, true = 1).
 * @param durationMs - Morph duration shared by every surface of one bar morph.
 * @param onSettled - Extra settle handler, same contract as the progress hook.
 * @param onStart - Extra start handler, same contract as the progress hook.
 */
export const useAtomMorph = (
  targetAtom: Atom<boolean>,
  durationMs: number,
  onSettled?: SettleHandler,
  onStart?: SettleHandler,
) => {
  const [isMorphing, setIsMorphing] = useState(false)

  const handleStart = useCallback(
    (isTarget: boolean) => {
      setIsMorphing(true)
      onStart?.(isTarget)
    },
    [onStart],
  )
  const handleSettled = useCallback(
    (isTarget: boolean) => {
      setIsMorphing(false)
      onSettled?.(isTarget)
    },
    [onSettled],
  )

  const progress = useAtomMorphProgress(targetAtom, durationMs, handleSettled, handleStart)

  return { isMorphing, progress }
}
