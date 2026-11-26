import { action, atom } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, MIN_QUERY_LENGTH, searchQueryAtom } from './model'

// Query counts as active only once it reaches MIN_QUERY_LENGTH after trimming;
// whitespace-only input keeps the sections mode and never pins the field.
export const isSearchQueryActive = (query: string) => query.trim().length >= MIN_QUERY_LENGTH

// The bottom field pill lives in the bottom chrome only while the search route
// is open, and only while the bar is expanded or the query is active. The route
// no longer writes its session flag: the input moved to the page, so in the app
// this is always false. The bottom-island morph suite still exercises the pill
// through it until that dead mode is removed.
export const isSearchFieldVisibleAtom = atom(ctx => {
  if (!ctx.spy(isSearchOpenAtom)) return false

  const isBarCollapsed = ctx.spy(isBarCollapsedAtom)

  return !isBarCollapsed || isSearchQueryActive(ctx.spy(searchQueryAtom))
}, 'isSearchFieldVisibleAtom')

// The bar is a full-width search surface only while the keyboard owns the
// field; the morph reads this flag to retract the tab island.
export const isSearchFieldFocusedAtom = atom(false, 'isSearchFieldFocusedAtom')

// External request to focus the visible search input: a tap anywhere on the
// open pill's surface bumps the nonce, and `SearchBar` focuses the field once
// per request. Focus stays user-driven — only a real gesture raises this.
export const searchFocusRequestAtom = atom(0, 'searchFocusRequestAtom')

export const focusSearchInput = action(ctx => {
  searchFocusRequestAtom(ctx, ctx.get(searchFocusRequestAtom) + 1)
}, 'focusSearchInput')
