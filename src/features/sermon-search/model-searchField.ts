import { action, atom } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, MIN_QUERY_LENGTH, searchQueryAtom } from './model'

// Query counts as active only once it reaches MIN_QUERY_LENGTH after trimming;
// whitespace-only input keeps the sections mode and never pins the field.
export const isSearchQueryActive = (query: string) => query.trim().length >= MIN_QUERY_LENGTH

// Whether a route pushed from the search results covers the overlay. SearchGate
// syncs this from the pathname; the session stays mounted underneath, so back
// restores the exact query, group and loaded pages.
const isSearchOverlayHiddenAtom = atom(false, 'isSearchOverlayHiddenAtom')

/**
 * Mirrors the covered-overlay state from SearchGate. Writing only on a real
 * change keeps the effect idempotent and prevents render loops.
 * @param ctx - Reatom context.
 * @param isHidden - Whether a detail route currently covers the overlay.
 */
export const setSearchOverlayHidden = action((ctx, isHidden: boolean) => {
  if (ctx.get(isSearchOverlayHiddenAtom) === isHidden) return

  isSearchOverlayHiddenAtom(ctx, isHidden)
}, 'setSearchOverlayHidden')

// The overlay is the visible layer only while the session is open and no
// covered detail route sits on top of it.
export const isSearchOverlayVisibleAtom = atom(ctx => {
  const isSearchOpen = ctx.spy(isSearchOpenAtom)
  if (!isSearchOpen) return false

  return !ctx.spy(isSearchOverlayHiddenAtom)
}, 'isSearchOverlayVisibleAtom')

// The search field pill is on screen while the overlay is visible and either the
// bar is expanded or the query is active. A collapsed bar with an empty query
// hands the whole line back to the compact player + search circle.
export const isSearchFieldVisibleAtom = atom(ctx => {
  if (!ctx.spy(isSearchOverlayVisibleAtom)) return false

  const isBarCollapsed = ctx.spy(isBarCollapsedAtom)

  return !isBarCollapsed || isSearchQueryActive(ctx.spy(searchQueryAtom))
}, 'isSearchFieldVisibleAtom')

// The bar is a full-width search surface only while the keyboard owns the
// field; the morph reads this flag to retract the active-tab circle.
export const isSearchFieldFocusedAtom = atom(false, 'isSearchFieldFocusedAtom')

// While the search page owns the screen the bottom chrome must never collapse
// under its lists. A covered overlay no longer owns the screen, so the detail
// route underneath scrolls normally.
export const isSearchBarCollapseSuspendedAtom = atom(
  ctx => ctx.spy(isSearchOverlayVisibleAtom),
  'isSearchBarCollapseSuspendedAtom',
)
