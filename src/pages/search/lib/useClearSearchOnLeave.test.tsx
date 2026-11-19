import { createCtx } from '@reatom/framework'
import { Keyboard } from 'react-native'
import {
  isSearchFieldFocusedAtom,
  isSearchOpenAtom,
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

    await rerender({ pathname: '/search/playlist' })

    expect(ctx.get(searchQueryAtom)).toBe('вера')
    expect(ctx.get(searchSessionNonceAtom)).toBe(2)
    expect(dismissSpy).not.toHaveBeenCalled()
  })

  test('marks search open while the search route owns the screen', async () => {
    const ctx = createCtx()

    await renderClear({ pathname: '/search' }, { ctx })

    expect(ctx.get(isSearchOpenAtom)).toBe(true)
  })

  test('keeps search open under a nested search detail route', async () => {
    const ctx = createCtx()

    await renderClear({ pathname: '/search/preacher' }, { ctx })

    expect(ctx.get(isSearchOpenAtom)).toBe(true)
  })

  test('marks search closed on any other route', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)

    await renderClear({ pathname: '/more' }, { ctx })

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
  })
})
