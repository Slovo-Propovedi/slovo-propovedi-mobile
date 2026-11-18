import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { isTabIslandCollapsedAtom } from './barMorph'

/**
 * One progress for the tab island's width/height morph, shared by its glass and
 * the search pill's vertical geometry. Started in the atom subscription so the
 * first morph frame commits in the same tick as the atom flip.
 */
export const tabIslandMorphDriver = createAtomMorphDriver({
  atom: isTabIslandCollapsedAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})
