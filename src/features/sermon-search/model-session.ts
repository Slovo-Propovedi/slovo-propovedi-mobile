import { action, type Ctx } from '@reatom/framework'
import { setBarCollapsed } from 'shared/ui/layout'
import {
  cancelInFlightFetches,
  isSearchingAtom,
  isSearchOpenAtom,
  lastFetchedQueryAtom,
  searchPlaylistsAtom,
  searchPreachersAtom,
  searchQueryAtom,
  searchResultsAtom,
} from './model'
import { isSearchFieldFocusedAtom } from './model-searchField'

// Every field a closed session owns. Cleared in ONE transaction by the close
// actions so no subscriber renders a half-closed search.
const clearSearchSessionState = (ctx: Ctx): void => {
  searchQueryAtom(ctx, '')
  searchResultsAtom(ctx, [])
  searchPlaylistsAtom(ctx, [])
  searchPreachersAtom(ctx, [])
  isSearchingAtom(ctx, false)
  lastFetchedQueryAtom(ctx, '')
  isSearchFieldFocusedAtom(ctx, false)
}

export const openSearch = action(async ctx => {
  await ctx.schedule(() => {
    // Opening search must reveal the field; a collapsed bar would hide it again.
    setBarCollapsed(ctx, false)
    isSearchOpenAtom(ctx, true)
  })
}, 'openSearch')

export const closeSearch = action(async ctx => {
  cancelInFlightFetches()
  await ctx.schedule(() => {
    clearSearchSessionState(ctx)
    isSearchOpenAtom(ctx, false)
  })
}, 'closeSearch')

// Dismissing the search from the collapsed active-tab circle must restore the
// plain expanded bar in ONE flip. Writing the bar state and the search state in
// separate transactions made the empty field pop up for a frame (the expanded
// bar + open search reads as a visible field) before the bar finished morphing.
export const closeSearchAndExpand = action(async ctx => {
  cancelInFlightFetches()
  await ctx.schedule(() => {
    clearSearchSessionState(ctx)
    isSearchOpenAtom(ctx, false)
    setBarCollapsed(ctx, false)
  })
}, 'closeSearchAndExpand')
