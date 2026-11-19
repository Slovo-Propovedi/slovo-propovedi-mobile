import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { advanceMorphFrames, countActiveMorphFrames } from 'shared/mocks/morphFrames'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { setBarCollapsed } from 'shared/ui/layout'
import { oneLineBarMorphDriver } from './oneLineBarMorphDriver'

describe('oneLineBarMorphDriver', () => {
  beforeEach(() => {
    oneLineBarMorphDriver.reset()
  })

  test('attaches one subscription no matter how many hooks mount', async () => {
    const ctx = createCtx()
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    // Two surfaces share the driver, but only one UI-thread clock may step the
    // shared value; the second would double the morph speed.
    expect(countActiveMorphFrames()).toBe(1)
    expect(oneLineBarMorphDriver.progress.value).toBe(0)
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
    await act(async () => {
      advanceMorphFrames()
    })
    expect(result.current.progress.value).toBe(1)
    expect(result.current.settled).toBe(true)

    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    await act(async () => {
      advanceMorphFrames()
    })
    expect(result.current.progress.value).toBe(0)
    expect(result.current.settled).toBe(false)
  })

  test('notifies start listeners before the clock runs, then settles', async () => {
    const ctx = createCtx()
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })
    const events: string[] = []
    oneLineBarMorphDriver.registerStartListener(() => events.push('start'))
    oneLineBarMorphDriver.registerSettleListener(() => events.push('settle'))

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    // The flip commits the start on the JS tick; frames land the target later.
    expect(events).toEqual(['start'])
    expect(oneLineBarMorphDriver.progress.value).toBe(0)

    await act(async () => {
      advanceMorphFrames()
    })

    expect(events).toEqual(['start', 'settle'])
    expect(oneLineBarMorphDriver.progress.value).toBe(1)
  })

  test('reports no settle for the direction an interrupting flip aborted', async () => {
    const ctx = createCtx()
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })
    const onSettle = jest.fn()
    oneLineBarMorphDriver.registerSettleListener(onSettle)

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    // Only the retargeted direction lands; the aborted collapse reports nothing.
    expect(onSettle).toHaveBeenCalledTimes(1)
    expect(onSettle).toHaveBeenCalledWith(false)
  })

  test('a remount cannot lose a mid-flight morph', async () => {
    const ctx = createCtx()
    const firstMount = await renderHookWithProviders(
      () => useAtomMorphDriver(oneLineBarMorphDriver),
      { ctx },
    )

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    expect(oneLineBarMorphDriver.progress.value).toBe(0)

    await firstMount.unmount()

    // No surface owns a clock here; the flip must still arm the driver and the
    // next mount must resume it from the current value.
    await act(async () => {
      setBarCollapsed(ctx, false)
    })

    const lateSettle = jest.fn()
    oneLineBarMorphDriver.registerSettleListener(lateSettle)
    await renderHookWithProviders(() => useAtomMorphDriver(oneLineBarMorphDriver), { ctx })

    await act(async () => {
      advanceMorphFrames()
    })
    expect(lateSettle).toHaveBeenCalledWith(false)
    expect(oneLineBarMorphDriver.progress.value).toBe(0)
  })

  test('mirrors the current atom value on attach without animating', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    oneLineBarMorphDriver.ensure(ctx)

    expect(oneLineBarMorphDriver.progress.value).toBe(1)
    expect(countActiveMorphFrames()).toBe(0)
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
    expect(countActiveMorphFrames()).toBe(0)
  })

  test('commits the start state of a flip that interrupts an in-flight morph', async () => {
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
      advanceMorphFrames()
    })
    expect(result.current.settled).toBe(true)
    expect(oneLineBarMorphDriver.progress.value).toBe(1)
  })

  test('seeds the shared value from the atom without animating', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    oneLineBarMorphDriver.seed(ctx)

    expect(oneLineBarMorphDriver.progress.value).toBe(1)
    expect(countActiveMorphFrames()).toBe(0)
  })

  test('snaps the value and reports the settle without animating', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    const onSettle = jest.fn()
    oneLineBarMorphDriver.registerSettleListener(onSettle)

    oneLineBarMorphDriver.snap(ctx)

    expect(oneLineBarMorphDriver.progress.value).toBe(1)
    expect(onSettle).toHaveBeenCalledWith(true)
    expect(countActiveMorphFrames()).toBe(0)
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
    await act(async () => {
      advanceMorphFrames()
    })

    expect(oneLineBarMorphDriver.progress.value).toBe(0)
    expect(onSettle).not.toHaveBeenCalled()
  })
})
