import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isBarCollapsedAtom, setBarCollapsed } from 'shared/ui/layout'
import { isSearchOpenAtom } from '../model'
import { useSettledSearchFieldVisible } from './useSettledSearchFieldVisible'

const mockedWithTiming = withTiming as jest.Mock

const createOpenSearchCtx = (isCollapsed = false) => {
  const ctx = createCtx()
  isSearchOpenAtom(ctx, true)
  isBarCollapsedAtom(ctx, isCollapsed)

  return ctx
}

describe('useSettledSearchFieldVisible', () => {
  test('starts settled-closed when the field is hidden', async () => {
    const ctx = createCtx()

    const { result } = await renderHookWithProviders(() => useSettledSearchFieldVisible(), { ctx })

    expect(result.current).toBe(false)
  })

  test('is settled-visible as soon as the field opens', async () => {
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useSettledSearchFieldVisible(), { ctx })

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    expect(result.current).toBe(true)
  })

  test('owns the shadow through the whole close morph and releases it only at settle', async () => {
    const ctx = createOpenSearchCtx()
    const { result } = await renderHookWithProviders(() => useSettledSearchFieldVisible(), { ctx })

    expect(result.current).toBe(true)

    let completeClose: ((finished: boolean) => void) | undefined
    mockedWithTiming.mockImplementationOnce((toValue, _config, callback) => {
      completeClose = callback
      return toValue
    })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    // The field is gone for React, but the pill is still shrinking: it must
    // remain the single shadow carrier until the morph actually lands.
    expect(result.current).toBe(true)

    await act(async () => {
      completeClose?.(true)
    })

    expect(result.current).toBe(false)
  })

  test('an interrupted close never hands the shadow back to the circle', async () => {
    const ctx = createOpenSearchCtx()
    const { result } = await renderHookWithProviders(() => useSettledSearchFieldVisible(), { ctx })

    let completeClose: ((finished: boolean) => void) | undefined
    mockedWithTiming.mockImplementationOnce((toValue, _config, callback) => {
      completeClose = callback
      return toValue
    })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    await act(async () => {
      completeClose?.(false)
    })

    expect(result.current).toBe(true)

    await act(async () => {
      setBarCollapsed(ctx, false)
    })

    expect(result.current).toBe(true)
  })
})
