import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { isOneLineBarAtom } from './barMorph'

/**
 * One progress for the bottom chrome's outer side inset morph, shared by the
 * islands row padding and the search pill geometry. Runs on the same duration
 * as the tab island and mini pill morphs, so the inset travels with them.
 */
export const oneLineBarMorphDriver = createAtomMorphDriver({
  atom: isOneLineBarAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})
