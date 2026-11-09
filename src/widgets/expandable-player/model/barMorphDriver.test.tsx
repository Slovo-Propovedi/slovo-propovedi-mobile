import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { BAR_MORPH_DURATION_MS, setBarCollapsed } from 'shared/ui/layout'
import {
  barMorphProgressSv,
  ensureBarMorphDriver,
  registerBarMorphSettleListener,
  registerBarMorphStartListener,
  resetBarMorphDriver,
} from './barMorphDriver'
import { useBarMorphProgress } from './useBarMorphProgress'

const mockedWithTiming = withTiming as jest.Mock
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

const captureCompletions = () => {
  const completions: Array<(finished: boolean) => void> = []
  mockedWithTiming.mockImplementation((toValue, _config, callback) => {
    if (typeof callback === 'function') completions.push(callback)

    return toValue
  })

  return completions
}

describe('barMorphDriver', () => {
  beforeEach(() => {
    resetBarMorphDriver()
    mockedWithTiming.mockClear()
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('attaches one subscription no matter how many hooks mount', async () => {
    const ctx = createCtx()
    await renderHookWithProviders(() => useBarMorphProgress(), { ctx })
    await renderHookWithProviders(() => useBarMorphProgress(), { ctx })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    expect(mockedWithTiming).toHaveBeenCalledTimes(1)
    expect(mockedWithTiming).toHaveBeenCalledWith(
      1,
      { duration: BAR_MORPH_DURATION_MS },
      expect.any(Function),
    )
  })

  test('every surface reads the same shared progress value', async () => {
    const ctx = createCtx()
    const first = await renderHookWithProviders(() => useBarMorphProgress(), { ctx })
    const second = await renderHookWithProviders(() => useBarMorphProgress(), { ctx })

    expect(first.result.current.progress).toBe(barMorphProgressSv)
    expect(second.result.current.progress).toBe(barMorphProgressSv)
  })

  test('dispatches start before the timing and settle when it lands', async () => {
    const ctx = createCtx()
    ensureBarMorphDriver(ctx)
    const events: string[] = []
    registerBarMorphStartListener(() => events.push('start'))
    registerBarMorphSettleListener(() => events.push('settle'))

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    expect(events).toEqual(['start', 'settle'])
    expect(mockedWithTiming).toHaveBeenCalledTimes(1)
    expect(barMorphProgressSv.value).toBe(1)
  })

  test('reports no settle for an animation that was interrupted', async () => {
    const completions = captureCompletions()
    const ctx = createCtx()
    ensureBarMorphDriver(ctx)
    const onSettle = jest.fn()
    registerBarMorphSettleListener(onSettle)

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      setBarCollapsed(ctx, false)
    })

    await act(async () => {
      completions[0](false)
    })
    expect(onSettle).not.toHaveBeenCalled()

    await act(async () => {
      completions[1](true)
    })
    expect(onSettle).toHaveBeenCalledWith(false)
  })

  test('mirrors the current atom value on attach without animating', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    ensureBarMorphDriver(ctx)

    expect(barMorphProgressSv.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })
})
