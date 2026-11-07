import { createCtx } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, openSearch, searchQueryAtom } from './model'
import { isSearchBarCollapseSuspendedAtom, isSearchFieldVisibleAtom } from './model-searchField'

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

describe('search bar collapse suspension', () => {
  test('does not suspend the scroll driver for an open search with an empty query', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: true, query: '' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(false)
  })

  test('suspends the scroll driver once the query is active', () => {
    const ctx = renderVisibility({ isCollapsed: true, isOpen: true, query: 'ве' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(true)
  })

  test('does not suspend the scroll driver while search is closed', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: false, query: '' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(false)
  })

  test('treats a whitespace-only query as inactive', () => {
    const ctx = renderVisibility({ isCollapsed: false, isOpen: true, query: '  ' })

    expect(ctx.get(isSearchBarCollapseSuspendedAtom)).toBe(false)
  })
})

describe('openSearch', () => {
  test('expands a collapsed bar so the search field becomes visible', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)

    await openSearch(ctx)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(true)
  })
})
