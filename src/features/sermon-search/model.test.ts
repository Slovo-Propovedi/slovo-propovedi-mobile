import { createCtx } from '@reatom/framework'
import { isBarCollapsedAtom, setBarCollapsed } from 'shared/ui/layout'
import { isSearchOpenAtom, searchInputRequestAtom, searchQueryAtom, typeSearchInput } from './model'
import { isSearchFieldFocusedAtom, isSearchFocusHeldAtom } from './model-searchField'
import { closeSearch, closeSearchAndExpand, openSearch } from './model-session'

describe('sermon-search model', () => {
  test('typeSearchInput sets the query and asks the visible input to adopt the text', () => {
    const ctx = createCtx()
    const partialQuery = 'ли'

    typeSearchInput(ctx, partialQuery)

    expect(ctx.get(searchQueryAtom)).toBe(partialQuery)
    expect(ctx.get(searchInputRequestAtom)?.text).toBe(partialQuery)

    // A repeated identical request still gets a fresh nonce so the input re-adopts it.
    const firstNonce = ctx.get(searchInputRequestAtom)?.nonce ?? 0
    typeSearchInput(ctx, partialQuery)

    expect(ctx.get(searchInputRequestAtom)?.nonce).toBe(firstNonce + 1)
  })

  test('openSearch opens the search and closeSearch resets query and focus', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, 'вера')
    isSearchFieldFocusedAtom(ctx, true)

    await openSearch(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(true)

    await closeSearch(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
  })

  test('closeSearchAndExpand clears the session and expands the bar in one flip', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    isSearchFieldFocusedAtom(ctx, true)
    isSearchFocusHeldAtom(ctx, true)
    setBarCollapsed(ctx, true)

    await closeSearchAndExpand(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
    expect(ctx.get(isSearchFocusHeldAtom)).toBe(false)
    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })
})
