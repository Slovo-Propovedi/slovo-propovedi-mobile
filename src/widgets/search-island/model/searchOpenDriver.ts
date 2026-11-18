import { isSearchFieldVisibleAtom } from 'features/sermon-search/@x/barMorph'
import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

/**
 * Search open progress: the pill's left/width morph grows from this one shared
 * value, frame by frame.
 */
export const searchOpenMorphDriver = createAtomMorphDriver({
  atom: isSearchFieldVisibleAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})
