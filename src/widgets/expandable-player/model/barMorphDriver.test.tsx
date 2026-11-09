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

  test('notifies start listeners before the timing is started, then settles', async () => {
    const ctx = createCtx()
    ensureBarMorphDriver(ctx)
    const events: string[] = []
    registerBarMorphStartListener(() => events.push('start'))
    registerBarMorphSettleListener(() => events.push('settle'))
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      // The factory call is the exact instant the animation starts: a listener
      // notified any later would leave a surface reading a target it was not
      // told about while the timing is already in flight.
      events.push('timing')
      if (typeof callback === 'function') callback(true)

      return toValue
    })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    expect(events).toEqual(['start', 'timing', 'settle'])
    expect(mockedWithTiming).toHaveBeenCalledTimes(1)
    expect(mockedWithTiming).toHaveBeenCalledWith(
      1,
      { duration: BAR_MORPH_DURATION_MS },
      expect.any(Function),
    )
    expect(barMorphProgressSv.value).toBe(1)
  })

  test('a remount cannot lose a mid-flight morph', async () => {
    const completions = captureCompletions()
    const ctx = createCtx()
    const firstMount = await renderHookWithProviders(() => useBarMorphProgress(), { ctx })

    // Morph 1 starts while the first mount owns the listeners; hold its landing.
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    expect(completions).toHaveLength(1)

    // Unmounting detaches the hook's listeners only: the driver subscription,
    // and with it the morph, must survive.
    await firstMount.unmount()

    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    expect(completions).toHaveLength(2)

    // A surface registering after the flip resumes a morph it never saw start:
    // the settle dispatch reads the live listener set, not a snapshot.
    const lateSettle = jest.fn()
    registerBarMorphSettleListener(lateSettle)
    const secondMount = await renderHookWithProviders(() => useBarMorphProgress(), { ctx })

    // The interrupted morph reports nothing...
    await act(async () => {
      completions[0](false)
    })
    expect(lateSettle).not.toHaveBeenCalled()

    // ...the in-flight one lands with the target the driver flipped to.
    await act(async () => {
      completions[1](true)
    })
    expect(lateSettle).toHaveBeenCalledWith(false)
    expect(barMorphProgressSv.value).toBe(0)
    expect(secondMount.result.current.progress).toBe(barMorphProgressSv)
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
