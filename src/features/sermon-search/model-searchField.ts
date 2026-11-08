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

// Search owns the scroll driver only while an active query pins the field: with
// an empty query the driver must still collapse the whole line.
export const isSearchBarCollapseSuspendedAtom = atom(
  ctx => ctx.spy(isSearchOpenAtom) && isSearchQueryActive(ctx.spy(searchQueryAtom)),
  'isSearchBarCollapseSuspendedAtom',
)
