import { atom } from '@reatom/framework'
import { isSearchFieldVisibleAtom } from 'features/sermon-search/@x/barMorph'
import { isBarCollapsedAtom } from 'shared/ui/layout'

// The pill collapses into the bottom line only when the bar is collapsed AND
// the search field is not occupying that line. A visible field keeps the pill
// detached above the row even with the bar collapsed.
export const isMiniPillCollapsedAtom = atom(
  ctx => ctx.spy(isBarCollapsedAtom) && !ctx.spy(isSearchFieldVisibleAtom),
  'isMiniPillCollapsedAtom',
)
