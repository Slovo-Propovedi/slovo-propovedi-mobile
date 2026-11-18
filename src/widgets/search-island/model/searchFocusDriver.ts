import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

/**
 * Focus progress shared by the search frame, the tucking mini pill and the
 * tab island fade. The surfaces read this one value, so the retraction cannot
 * desync.
 */
export const searchFocusMorphDriver = createAtomMorphDriver({
  atom: isSearchFieldFocusedAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})
