import { action } from '@reatom/framework'
import { setBarCollapsed } from 'shared/ui/layout'
import { isSearchOpenAtom, searchInputRequestAtom, searchQueryAtom } from './model'
import { isSearchFieldFocusedAtom } from './model-searchField'

// Opening writes the bar and the open flag in ONE transaction. Two separate
// writes target the tab-island morph twice in the same tick when the bar was
// collapsed: first "expand" (the flag is still false), then "collapse" as the
// field turns visible. The interrupted target can strand the island expanded /
// the pill unstarted, so the route opens without its morph. One transaction also
// makes the field visible before anything reads the half-open bar state.
export const openSearch = action(ctx => {
  setBarCollapsed(ctx, false)
  isSearchOpenAtom(ctx, true)
}, 'openSearch')

// Every field a search session owns. Cleared in ONE transaction when the user
// leaves the search route so no subscriber renders a half-cleared search. The
// empty input request bumps the nonce, so the mounted SearchBar clears its
// local field through the same channel a manual keystroke uses.
export const resetSearchSession = action(async ctx => {
  await ctx.schedule(() => {
    const previous = ctx.get(searchInputRequestAtom)

    searchQueryAtom(ctx, '')
    isSearchFieldFocusedAtom(ctx, false)
    searchInputRequestAtom(ctx, { nonce: (previous?.nonce ?? 0) + 1, text: '' })
  })
}, 'resetSearchSession')
