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

// The one-line bar: collapsed AND no search field occupying the row. Only in
// this state does the mini pill fold into the row (the expandable player reads
// the same driver), and the row's outer side inset widens with it
// (BAR_SIDE_INSET_COLLAPSED).
export const isOneLineBarAtom = atom(
  ctx => ctx.spy(isBarCollapsedAtom) && !ctx.spy(isSearchFieldVisibleAtom),
  'isOneLineBarAtom',
)
