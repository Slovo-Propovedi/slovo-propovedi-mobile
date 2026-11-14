import { atom } from '@reatom/framework'
import {
  isSearchFieldFocusedAtom,
  isSearchQueryActive,
  searchQueryAtom,
} from 'features/sermon-search/@x/barMorph'
import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'

// The ✕ is shown while the field is focused OR a typed query keeps it on
// screen. One atom (instead of the boolean derived in render) lets the morph
// subscribe and start before the React commit.
export const isSearchCloseVisibleAtom = atom(
  ctx => ctx.spy(isSearchFieldFocusedAtom) || isSearchQueryActive(ctx.spy(searchQueryAtom)),
  'isSearchCloseVisibleAtom',
)

/**
 * Presence progress of the external ✕. The search frame reserves its slot and
 * the shade cuts its hole from this same value, so the width and the cutout
 * fade together.
 */
export const searchCloseMorphDriver = createAtomMorphDriver({
  atom: isSearchCloseVisibleAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})
