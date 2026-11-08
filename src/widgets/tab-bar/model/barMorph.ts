import { atom } from '@reatom/framework'
import { isSearchFieldVisibleAtom } from 'features/sermon-search/@x/barMorph'
import { isBarCollapsedAtom } from 'shared/ui/layout'

// A visible search field forces the circle shape even when the scroll driver
// has not collapsed the bar yet, because the row then reads [circle][field].
// One atom (instead of the boolean derived in render) lets the morph subscribe
// and start before React commits.
export const isTabIslandCollapsedAtom = atom(
  ctx => ctx.spy(isBarCollapsedAtom) || ctx.spy(isSearchFieldVisibleAtom),
  'isTabIslandCollapsedAtom',
)
