import { isSearchOpenAtom } from 'features/sermon-search/@x/barMorph'
import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

/**
 * Search open progress: the pill's left/width morph grows out of the closed
 * circle from this one shared value, frame by frame. Driven by the route state
 * (the `/search` route owns the tabs navigator), not by a separate session flag.
 */
export const searchOpenMorphDriver = createAtomMorphDriver({
  atom: isSearchOpenAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})
