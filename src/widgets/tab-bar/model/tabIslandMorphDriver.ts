import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { isTabIslandCollapsedAtom } from './barMorph'

/**
 * One progress for the tab island's width/height morph, shared by its glass and
 * by the shade's island cutout. Started in the atom subscription so the first
 * morph frame and the hole move together instead of the hole jumping on settle.
 */
export const tabIslandMorphDriver = createAtomMorphDriver({
  atom: isTabIslandCollapsedAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})
