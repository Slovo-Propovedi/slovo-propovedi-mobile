import { createCtx } from '@reatom/framework'
import { withTiming } from 'react-native-reanimated'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { setBarCollapsed } from 'shared/ui/layout'
import { barMorphDriver, resetBarMorphDriver } from './barMorphDriver'
import { useLaunchBarState } from './useLaunchBarState'

const mockedWithTiming = withTiming as jest.Mock
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

describe('useLaunchBarState', () => {
  beforeEach(() => {
    resetBarMorphDriver()
    mockedWithTiming.mockClear()
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('expands a bar left collapsed by the previous process without a slide', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    await renderHookWithProviders(() => useLaunchBarState(), { ctx })

    expect(barMorphDriver.progress.value).toBe(0)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('lands expanded for a surface mounted after the launch snap', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    await renderHookWithProviders(() => useLaunchBarState(), { ctx })

    const { result } = await renderHookWithProviders(() => useAtomMorphDriver(barMorphDriver), {
      ctx,
    })

    expect(result.current.progress.value).toBe(0)
    expect(result.current.settled).toBe(false)
  })

  test('settles an attached morph to expanded instead of its start frame', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    const probe = await renderHookWithProviders(() => useAtomMorphDriver(barMorphDriver), { ctx })
    expect(probe.result.current.settled).toBe(true)

    // Hold the morph: an interrupted animation reports no settle of its own.
    mockedWithTiming.mockImplementation(toValue => toValue)

    await renderHookWithProviders(() => useLaunchBarState(), { ctx })

    expect(barMorphDriver.progress.value).toBe(0)
    expect(probe.result.current.settled).toBe(false)
  })

  test('keeps an already expanded bar at rest without a morph', async () => {
    const ctx = createCtx()

    await renderHookWithProviders(() => useLaunchBarState(), { ctx })

    expect(barMorphDriver.progress.value).toBe(0)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })
})
