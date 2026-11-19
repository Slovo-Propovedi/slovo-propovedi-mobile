import { createCtx } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, searchQueryAtom } from './model'
import {
  isSearchBarCollapseSuspendedAtom,
  isSearchFieldFocusedAtom,
  isSearchFieldVisibleAtom,
} from './model-searchField'
import { openSearch, resetSearchSession } from './model-session'

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
  test('is visible while the search route is open with an empty query', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: true, query: '' })

    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })

  test('stays visible on a collapsed bar with an active query', () => {
    const ctx = renderVisibility({ isCollapsed: true, isOpen: true, query: 'вера' })

    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })

  test('is hidden while the search route is closed, regardless of the bar state', () => {
    const expanded = renderVisibility({ isCollapsed: false, isOpen: false, query: 'вера' })
    const collapsed = renderVisibility({ isCollapsed: true, isOpen: false, query: '' })

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

describe('openSearch', () => {
  test('expands the bar and reveals the field in one transaction', () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    const fieldVisibility: boolean[] = []
    ctx.subscribe(isSearchFieldVisibleAtom, isVisible => fieldVisibility.push(isVisible))
    // The open flag must already be true when the bar reports expanded: separate
    // writes would first target the island's morph driver to expand and only then
    // re-target it to collapse in the same tick (a stranded, animation-less morph).
    const openWhenExpanded: boolean[] = []
    ctx.subscribe(isBarCollapsedAtom, isCollapsed => {
      if (!isCollapsed) openWhenExpanded.push(ctx.get(isSearchOpenAtom))
    })

    openSearch(ctx)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
    expect(openWhenExpanded).toEqual([true])
    // The field appears once: no intermediate frame where the bar expands empty.
    expect(fieldVisibility).toEqual([false, true])
  })
})

describe('resetSearchSession', () => {
  test('clears the query and the focused flag in one transaction', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    isBarCollapsedAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    isSearchFieldFocusedAtom(ctx, true)

    await resetSearchSession(ctx)

    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
  })
})

describe('search bar collapse suspension', () => {
  test('suspends the scroll driver while the search route is open', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: true, query: '' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(true)
  })

  test('does not suspend the scroll driver on other routes', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: false, query: '' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(false)
  })
})
