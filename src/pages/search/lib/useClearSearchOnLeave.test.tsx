import { createCtx } from '@reatom/framework'
import { Keyboard } from 'react-native'
import {
  isSearchFieldFocusedAtom,
  isSearchOpenAtom,
  searchFocusRequestAtom,
  searchQueryAtom,
} from 'features/sermon-search/@x/barMorph'
import { renderHookWithProviders } from 'shared/mocks'
import { searchSessionNonceAtom } from '../model/searchSession'
import { useClearSearchOnLeave } from './useClearSearchOnLeave'

const dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {})

const renderClear = (
  initialProps: { pathname: string },
  options?: { ctx?: ReturnType<typeof createCtx> },
) =>
  renderHookWithProviders((props: { pathname: string }) => useClearSearchOnLeave(props.pathname), {
    ...options,
    initialProps,
  })

describe('useClearSearchOnLeave', () => {
  beforeEach(() => {
    dismissSpy.mockClear()
  })

  test('resets the search session when the path leaves the search route', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, false)
    searchQueryAtom(ctx, 'вера')
    isSearchFieldFocusedAtom(ctx, true)
    searchSessionNonceAtom(ctx, 0)

    const { rerender } = await renderClear({ pathname: '/search' }, { ctx })

    searchSessionNonceAtom(ctx, 5)
    searchQueryAtom(ctx, 'вера')

    await rerender({ pathname: '/listen' })

    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
    expect(ctx.get(searchSessionNonceAtom)).toBe(6)
    expect(dismissSpy).toHaveBeenCalled()
  })

  test('keeps the session while a detail route is pushed inside the search route', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, 'вера')
    searchSessionNonceAtom(ctx, 2)

    const { rerender } = await renderClear({ pathname: '/search' }, { ctx })
    const focusRequestOnEntry = ctx.get(searchFocusRequestAtom)

    await rerender({ pathname: '/search/playlist' })

    expect(ctx.get(searchQueryAtom)).toBe('вера')
    expect(ctx.get(searchSessionNonceAtom)).toBe(2)
    expect(dismissSpy).not.toHaveBeenCalled()
    // The detail push stays inside the search route, so the page field keeps the
    // focus the entry already requested.
    expect(ctx.get(searchFocusRequestAtom)).toBe(focusRequestOnEntry)
  })

  test('focuses the page field when the search route opens', async () => {
    const ctx = createCtx()
    searchFocusRequestAtom(ctx, 0)

    const { rerender } = await renderClear({ pathname: '/listen' }, { ctx })

    expect(ctx.get(searchFocusRequestAtom)).toBe(0)

    await rerender({ pathname: '/search' })

    expect(ctx.get(searchFocusRequestAtom)).toBeGreaterThan(0)
  })

  test('does not write the retired bottom island open flag on the route', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, false)

    await renderClear({ pathname: '/search' }, { ctx })

    // The field lives on the page: nothing reopens the bottom island's pill.
    expect(ctx.get(isSearchOpenAtom)).toBe(false)
  })

  test('leaves the retired bottom island open flag untouched on other routes', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, false)

    await renderClear({ pathname: '/more' }, { ctx })

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
  })
})
