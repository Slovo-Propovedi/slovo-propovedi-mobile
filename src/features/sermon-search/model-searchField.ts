import { atom } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, MIN_QUERY_LENGTH, searchQueryAtom } from './model'

// Query counts as active only once it reaches MIN_QUERY_LENGTH after trimming;
// whitespace-only input keeps the sections mode and never pins the field.
export const isSearchQueryActive = (query: string) => query.trim().length >= MIN_QUERY_LENGTH

// The search field pill is on screen while the session is open and either the
// bar is expanded or the query is active. A collapsed bar with an empty query
// hands the whole line back to the compact player + search circle.
export const isSearchFieldVisibleAtom = atom(ctx => {
  const isSearchOpen = ctx.spy(isSearchOpenAtom)
  if (!isSearchOpen) return false

  const isBarCollapsed = ctx.spy(isBarCollapsedAtom)

  return !isBarCollapsed || isSearchQueryActive(ctx.spy(searchQueryAtom))
}, 'isSearchFieldVisibleAtom')

// The bar is a full-width search surface only while the keyboard owns the
// field; the morph reads this flag to retract the active-tab circle.
export const isSearchFieldFocusedAtom = atom(false, 'isSearchFieldFocusedAtom')

// While the search page is open it owns the screen: the bottom chrome must
// never collapse under its lists, whatever the query length is.
export const isSearchBarCollapseSuspendedAtom = atom(
  ctx => ctx.spy(isSearchOpenAtom),
  'isSearchBarCollapseSuspendedAtom',
)
