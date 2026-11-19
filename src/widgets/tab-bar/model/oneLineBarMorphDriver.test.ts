import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { BAR_MORPH_DURATION_MS, setBarCollapsed } from 'shared/ui/layout'
import { oneLineBarMorphDriver } from './oneLineBarMorphDriver'

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

describe('oneLineBarMorphDriver', () => {
  beforeEach(() => {
    oneLineBarMorphDriver.reset()
    mockedWithTiming.mockClear()
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('attaches one subscription no matter how many hooks mount', async () => {
    const ctx = createCtx()
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })

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
    const first = await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), {
      ctx,
    })
    const second = await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), {
      ctx,
    })

    expect(first.result.current.progress).toBe(oneLineBarMorphDriver.progress)
    expect(second.result.current.progress).toBe(oneLineBarMorphDriver.progress)
  })

  test('drives the progress from 0 to 1 and back on each flip', async () => {
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(
      () => useAtomMorphDriver(oneLineBarMorphDriver),
      { ctx },
    )

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    expect(result.current.progress.value).toBe(1)
    expect(result.current.settled).toBe(true)

    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    expect(result.current.progress.value).toBe(0)
    expect(result.current.settled).toBe(false)
  })

  test('notifies start listeners before the timing is started, then settles', async () => {
    const ctx = createCtx()
    oneLineBarMorphDriver.ensure(ctx)
    const events: string[] = []
    oneLineBarMorphDriver.registerStartListener(() => events.push('start'))
    oneLineBarMorphDriver.registerSettleListener(() => events.push('settle'))
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      events.push('timing')
      if (typeof callback === 'function') callback(true)

      return toValue
    })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    expect(events).toEqual(['start', 'timing', 'settle'])
    expect(oneLineBarMorphDriver.progress.value).toBe(1)
  })

  test('reports no settle for an animation that was interrupted', async () => {
    const completions = captureCompletions()
    const ctx = createCtx()
    oneLineBarMorphDriver.ensure(ctx)
    const onSettle = jest.fn()
    oneLineBarMorphDriver.registerSettleListener(onSettle)

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

  test('a remount cannot lose a mid-flight morph', async () => {
    const completions = captureCompletions()
    const ctx = createCtx()
    const firstMount = await renderHookWithProviders(
      () => useAtomMorphDriver(oneLineBarMorphDriver),
      { ctx },
    )

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    expect(completions).toHaveLength(1)

    await firstMount.unmount()

    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    expect(completions).toHaveLength(2)

    const lateSettle = jest.fn()
    oneLineBarMorphDriver.registerSettleListener(lateSettle)
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })

    await act(async () => {
      completions[0](false)
    })
    expect(lateSettle).not.toHaveBeenCalled()

    await act(async () => {
      completions[1](true)
    })
    expect(lateSettle).toHaveBeenCalledWith(false)
    expect(oneLineBarMorphDriver.progress.value).toBe(0)
  })

  test('mirrors the current atom value on attach without animating', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    oneLineBarMorphDriver.ensure(ctx)

    expect(oneLineBarMorphDriver.progress.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('stays expanded when a collapsed bar still shows the search field', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'проповедь')

    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    expect(oneLineBarMorphDriver.progress.value).toBe(0)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('commits the start state of a flip that interrupts an in-flight morph', async () => {
    const completions = captureCompletions()
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    const { result } = await renderHookWithProviders(
      () => useAtomMorphDriver(oneLineBarMorphDriver),
      { ctx },
    )

    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    expect(result.current.settled).toBe(true)

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    expect(result.current.settled).toBe(false)

    await act(async () => {
      completions[0](false)
    })
    expect(result.current.settled).toBe(false)

    await act(async () => {
      completions[1](true)
    })
    expect(result.current.settled).toBe(true)
  })

  test('seeds the shared value from the atom without animating', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    oneLineBarMorphDriver.seed(ctx)

    expect(oneLineBarMorphDriver.progress.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('snaps the value and reports the settle without animating', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    const onSettle = jest.fn()
    oneLineBarMorphDriver.registerSettleListener(onSettle)

    oneLineBarMorphDriver.snap(ctx)

    expect(oneLineBarMorphDriver.progress.value).toBe(1)
    expect(onSettle).toHaveBeenCalledWith(true)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('resets the value, drops listeners and detaches the subscription', async () => {
    const ctx = createCtx()
    const onSettle = jest.fn()
    oneLineBarMorphDriver.ensure(ctx)
    oneLineBarMorphDriver.registerSettleListener(onSettle)
    oneLineBarMorphDriver.progress.value = 1

    oneLineBarMorphDriver.reset()

    expect(oneLineBarMorphDriver.progress.value).toBe(0)
    expect(oneLineBarMorphDriver.isAttached()).toBe(false)

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(onSettle).not.toHaveBeenCalled()
  })
})
