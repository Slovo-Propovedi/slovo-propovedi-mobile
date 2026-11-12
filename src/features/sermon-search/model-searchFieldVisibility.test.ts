import { createCtx } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, searchQueryAtom } from './model'
import {
  holdSearchFocus,
  isSearchBarCollapseSuspendedAtom,
  isSearchFieldFocusedAtom,
  isSearchFieldVisibleAtom,
  isSearchFocusActiveAtom,
  isSearchFocusHeldAtom,
  releaseSearchFocusHold,
} from './model-searchField'
import { closeSearch, closeSearchAndExpand, openSearch } from './model-session'

const renderVisibility = ({
  isCollapsed,
  isOpen,
  query,
}: {
  isCollapsed: boolean
  isOpen: boolean
  query: string
}) => {
  const ctx = createCtx()
  isSearchOpenAtom(ctx, isOpen)
  isBarCollapsedAtom(ctx, isCollapsed)
  searchQueryAtom(ctx, query)

  return ctx
}

describe('search field visibility', () => {
  test('is visible while search is open on an expanded bar with an empty query', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: true, query: '' })

    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })

  test('is hidden when the bar collapses on an empty query', () => {
    const ctx = renderVisibility({ isCollapsed: true, isOpen: true, query: '' })

    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(false)
  })

  test('stays visible when the bar collapses on an active query', () => {
    const ctx = renderVisibility({ isCollapsed: true, isOpen: true, query: 'вера' })

    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })

  test('is hidden while search is closed, regardless of the bar state', () => {
    const expanded = renderVisibility({ isCollapsed: false, isOpen: false, query: 'вера' })
    const collapsed = renderVisibility({ isCollapsed: true, isOpen: false, query: 'вера' })

    expect(expanded.get(isSearchFieldVisibleAtom)).toBe(false)
    expect(collapsed.get(isSearchFieldVisibleAtom)).toBe(false)
  })

  test('treats a whitespace-only query as empty', () => {
    const ctx = renderVisibility({ isCollapsed: true, isOpen: true, query: '   ' })

    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(false)
  })

  test('treats a one-character query as empty below MIN_QUERY_LENGTH', () => {
    const ctx = renderVisibility({ isCollapsed: true, isOpen: true, query: 'в' })

    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(false)
  })
})

describe('search field focus', () => {
  test('closing the search clears the focused flag', async () => {
    const ctx = createCtx()
    isSearchFieldFocusedAtom(ctx, true)

    await closeSearch(ctx)

    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
  })
})

describe('search focus hold', () => {
  test('the active flag tracks the field focus while no hold is set', () => {
    const ctx = createCtx()

    expect(ctx.get(isSearchFocusActiveAtom)).toBe(false)

    isSearchFieldFocusedAtom(ctx, true)
    expect(ctx.get(isSearchFocusActiveAtom)).toBe(true)

    isSearchFieldFocusedAtom(ctx, false)
    expect(ctx.get(isSearchFocusActiveAtom)).toBe(false)
  })

  test('holding keeps the active flag while the field is blurred', () => {
    const ctx = createCtx()

    holdSearchFocus(ctx)

    expect(ctx.get(isSearchFocusHeldAtom)).toBe(true)
    expect(ctx.get(isSearchFocusActiveAtom)).toBe(true)

    isSearchFieldFocusedAtom(ctx, true)
    isSearchFieldFocusedAtom(ctx, false)
    expect(ctx.get(isSearchFocusActiveAtom)).toBe(true)
  })

  test('releasing the hold drops the active flag when the field is blurred', () => {
    const ctx = createCtx()
    holdSearchFocus(ctx)

    releaseSearchFocusHold(ctx)

    expect(ctx.get(isSearchFocusHeldAtom)).toBe(false)
    expect(ctx.get(isSearchFocusActiveAtom)).toBe(false)
  })

  test('closing the search releases the hold', async () => {
    const ctx = createCtx()
    holdSearchFocus(ctx)

    await closeSearch(ctx)

    expect(ctx.get(isSearchFocusHeldAtom)).toBe(false)
    expect(ctx.get(isSearchFocusActiveAtom)).toBe(false)
  })
})

describe('search bar collapse suspension', () => {
  test('suspends the scroll driver while search is open on an empty query', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: true, query: '' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(true)
  })

  test('suspends the scroll driver once the query is active', () => {
    const ctx = renderVisibility({ isCollapsed: true, isOpen: true, query: 'ве' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(true)
  })

  test('does not suspend the scroll driver while search is closed', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: false, query: '' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(false)
  })

  test('suspends the scroll driver on a whitespace-only query while search is open', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: true, query: '  ' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(true)
  })
})

// The mini player rests detached above the row unless the collapsed line owns
// it: collapsed and no visible field. Mirrors useExpandablePlayerState.
const isMiniDetached = (ctx: ReturnType<typeof createCtx>) =>
  !ctx.get(isBarCollapsedAtom) || ctx.get(isSearchFieldVisibleAtom)

describe('single-tap search circle transitions', () => {
  test('an expanded closed bar opens the [circle][field] strip atomically', async () => {
    const ctx = createCtx()
    const fieldVisibility: boolean[] = []
    ctx.subscribe(isSearchFieldVisibleAtom, isVisible => fieldVisibility.push(isVisible))

    await openSearch(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
    expect(isMiniDetached(ctx)).toBe(true)
    // One flip: the field appears once and never drops back to the circle.
    expect(fieldVisibility).toEqual([false, true])
  })

  test('opening search lands in the final state synchronously, without a deferred tap', () => {
    const ctx = createCtx()

    void openSearch(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })

  test('a collapsed bar with search open closes search and expands atomically', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    isBarCollapsedAtom(ctx, true)
    searchQueryAtom(ctx, '')
    const fieldVisibility: boolean[] = []
    ctx.subscribe(isSearchFieldVisibleAtom, isVisible => fieldVisibility.push(isVisible))

    await closeSearchAndExpand(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(false)
    expect(isMiniDetached(ctx)).toBe(true)
    // No intermediate: expanding first would pop the empty field up for a frame.
    expect(fieldVisibility).toEqual([false])
  })

  test('closing search and expanding lands in the final state synchronously', () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    isBarCollapsedAtom(ctx, true)
    searchQueryAtom(ctx, '')

    void closeSearchAndExpand(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(false)
  })
})

describe('openSearch', () => {
  test('opening search from a collapsed bar never exposes an open+collapsed frame', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    const fieldVisibility: boolean[] = []
    ctx.subscribe(isSearchFieldVisibleAtom, isVisible => fieldVisibility.push(isVisible))

    await openSearch(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    // The field appears once. A frame where search is open but the bar is still
    // collapsed would read as `visible: false` after the open write and hide
    // the pill again — that is exactly the "first tap does nothing" report.
    expect(fieldVisibility).toEqual([false, true])
  })

  test('expands a collapsed bar so the search field becomes visible', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)

    await openSearch(ctx)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })

  test('expands a collapsed bar on the first call even when search is already open', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    isBarCollapsedAtom(ctx, true)

    await openSearch(ctx)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })
})
