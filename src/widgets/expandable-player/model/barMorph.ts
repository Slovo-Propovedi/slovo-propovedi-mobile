import { atom } from '@reatom/framework'
import {
  isSearchFieldFocusedAtom,
  isSearchFieldVisibleAtom,
} from 'features/sermon-search/@x/barMorph'
import { isBarCollapsedAtom } from 'shared/ui/layout'

// The pill collapses into the bottom line only when the bar is collapsed AND
// the search field is not occupying that line. A visible field keeps the pill
// detached above the row even with the bar collapsed; a focused field owns the
// whole row, so the pill stays detached through that frame too.
export const isMiniPillCollapsedAtom = atom(
  ctx =>
    ctx.spy(isBarCollapsedAtom) &&
    !ctx.spy(isSearchFieldVisibleAtom) &&
    !ctx.spy(isSearchFieldFocusedAtom),
  'isMiniPillCollapsedAtom',
)
