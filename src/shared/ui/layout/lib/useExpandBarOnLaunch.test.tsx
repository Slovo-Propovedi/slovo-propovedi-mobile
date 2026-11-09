import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from '../../../mocks'
import { isBarCollapsedAtom, setBarCollapsed } from '../model'
import { useExpandBarOnLaunch } from './useExpandBarOnLaunch'

describe('useExpandBarOnLaunch', () => {
  test('expands a bar left collapsed by the previous process', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    await renderHookWithProviders(() => useExpandBarOnLaunch(), { ctx })

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })

  test('resets only on mount, not on later renders', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    const { rerender } = await renderHookWithProviders(() => useExpandBarOnLaunch(), { ctx })

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)

    act(() => {
      setBarCollapsed(ctx, true)
    })

    await rerender(undefined)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)
  })
})
