import { createCtx } from '@reatom/framework'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { isSearchOpenAtom, searchQueryAtom } from './model'
import { isSearchFieldFocusedAtom, isSearchFieldVisibleAtom } from './model-searchField'
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
  test('expands the bar without opening the retired bottom field', () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)

    openSearch(ctx)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    // The input lives on the page: opening search expands the bar only, so the
    // bottom island stays in its closed circle pose.
    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(ctx.get(isSearchFieldVisibleAtom)).toBe(false)
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
