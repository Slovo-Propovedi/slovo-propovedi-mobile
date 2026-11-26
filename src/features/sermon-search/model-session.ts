import { action } from '@reatom/framework'
import { setBarCollapsed } from 'shared/ui/layout'
import { searchInputRequestAtom, searchQueryAtom } from './model'
import { isSearchFieldFocusedAtom } from './model-searchField'

// Opening search only expands the bottom bar: the input lives on the page now,
// so no session flag is written here. Expanding in the press tick (before the
// route commits) keeps the bar from expanding a frame late on the new screen.
export const openSearch = action(ctx => {
  setBarCollapsed(ctx, false)
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
