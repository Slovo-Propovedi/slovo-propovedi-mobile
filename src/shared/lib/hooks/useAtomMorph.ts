import { type Atom } from '@reatom/framework'
import { useAtomMorphProgress } from './useAtomMorphProgress'

type SettleHandler = (isTarget: boolean) => void

/**
 * Morph progress of an atom-driven boolean, shared by every surface of one
 * transition.
 *
 * The animation stays owned by {@link useAtomMorphProgress}; this hook is the
 * surface-facing entry point and carries the start/settle hooks, so every
 * morphing surface subscribes to the same transition.
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
) => useAtomMorphProgress(targetAtom, durationMs, onSettled, onStart)
