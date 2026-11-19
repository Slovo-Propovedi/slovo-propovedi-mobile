import { atom } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, MIN_QUERY_LENGTH, searchQueryAtom } from './model'

// Query counts as active only once it reaches MIN_QUERY_LENGTH after trimming;
// whitespace-only input keeps the sections mode and never pins the field.
export const isSearchQueryActive = (query: string) => query.trim().length >= MIN_QUERY_LENGTH

// The search field pill lives in the bottom chrome only while the search route
// is open, and only while the bar is expanded or the query is active.
export const isSearchFieldVisibleAtom = atom(ctx => {
  if (!ctx.spy(isSearchOpenAtom)) return false

  const isBarCollapsed = ctx.spy(isBarCollapsedAtom)

  return !isBarCollapsed || isSearchQueryActive(ctx.spy(searchQueryAtom))
}, 'isSearchFieldVisibleAtom')

// The bar is a full-width search surface only while the keyboard owns the
// field; the morph reads this flag to retract the tab island.
export const isSearchFieldFocusedAtom = atom(false, 'isSearchFieldFocusedAtom')

// While the search route owns the screen the bottom chrome must never collapse
// under its lists — including the nested `/search/*` detail routes, where the
// field (and its keyboard state) stays alive underneath.
export const isSearchBarCollapseSuspendedAtom = atom(
  ctx => ctx.spy(isSearchOpenAtom),
  'isSearchBarCollapseSuspendedAtom',
)
