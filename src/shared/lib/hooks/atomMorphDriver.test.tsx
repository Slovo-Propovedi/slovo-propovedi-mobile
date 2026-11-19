import { atom, createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { advanceMorphFrames, countActiveMorphFrames } from '../../mocks/morphFrames'
import { renderHookWithProviders } from '../../mocks/renderWithProviders'
import { createAtomMorphDriver } from './atomMorphDriver'
import { useAtomMorphDriver } from './useAtomMorphDriver'

const DURATION_MS = 300

describe('atomMorphDriver', () => {
  test('shares one progress value between every mounted surface', async () => {
    const driver = createAtomMorphDriver({
      atom: atom(false, 'testSharedMorphAtom'),
      durationMs: DURATION_MS,
    })
    const first = await renderHookWithProviders(() => useAtomMorphDriver(driver))
    const second = await renderHookWithProviders(() => useAtomMorphDriver(driver))

    expect(first.result.current.progress).toBe(driver.progress)
    expect(second.result.current.progress).toBe(driver.progress)

    driver.reset()
  })

  test('seeds a surface mounted in the target state without animating', async () => {
    const driver = createAtomMorphDriver({
      atom: atom(true, 'testSeededMorphAtom'),
      durationMs: DURATION_MS,
    })

    const { result } = await renderHookWithProviders(() => useAtomMorphDriver(driver))

    expect(driver.progress.value).toBe(1)
    expect(result.current.settled).toBe(true)
    expect(countActiveMorphFrames()).toBe(0)

    driver.reset()
  })

  test('starts one clock per flip and commits the start, then the target', async () => {
    const target = atom(false, 'testFlippedMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const { ctx, result } = await renderHookWithProviders(() => useAtomMorphDriver(driver))

    await act(async () => {
      target(ctx, true)
    })

    // The clock is armed by the flip itself, before any React commit.
    expect(countActiveMorphFrames()).toBe(1)
    // The shadow tree commits the START geometry until the morph lands.
    expect(result.current.settled).toBe(false)
    expect(driver.progress.value).toBe(0)

    await act(async () => {
      advanceMorphFrames(1)
    })

    // 100ms of a 300ms morph: one third of the way, not the destination.
    expect(driver.progress.value).toBeCloseTo(1 / 3)
    expect(result.current.settled).toBe(false)

    await act(async () => {
      advanceMorphFrames()
    })

    expect(driver.progress.value).toBe(1)
    expect(result.current.settled).toBe(true)
    expect(countActiveMorphFrames()).toBe(0)

    driver.reset()
  })

  test('clamps a stalled frame delta and retargets from the current value', async () => {
    const target = atom(false, 'testClampedMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const onSettle = jest.fn()
    const { ctx } = await renderHookWithProviders(() => useAtomMorphDriver(driver))
    driver.registerSettleListener(onSettle)

    await act(async () => {
      target(ctx, true)
    })
    // A multi-second delta after a stall must advance by the clamped step only
    // (100ms / 300ms = 1/3), never teleport to the target.
    await act(async () => {
      advanceMorphFrames(1, 5000)
    })

    expect(driver.progress.value).toBeCloseTo(1 / 3)
    expect(onSettle).not.toHaveBeenCalled()

    // Flipping mid-flight retargets from the current 1/3: one more clamped step
    // lands exactly on 0, which a restart from 1 would not reach.
    await act(async () => {
      target(ctx, false)
    })
    await act(async () => {
      advanceMorphFrames(1)
    })

    expect(driver.progress.value).toBe(0)
    expect(onSettle).toHaveBeenCalledWith(false)
    expect(countActiveMorphFrames()).toBe(0)

    driver.reset()
  })

  test('snaps the shared value to the atom without animating', () => {
    const target = atom(true, 'testSnappedMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const ctx = createCtx()

    driver.snap(ctx)
    expect(driver.progress.value).toBe(1)

    target(ctx, false)
    driver.snap(ctx)
    expect(driver.progress.value).toBe(0)

    expect(countActiveMorphFrames()).toBe(0)

    driver.reset()
  })

  test('snap commits the settle once and never starts a morph', () => {
    const target = atom(true, 'testSettleSnapMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const ctx = createCtx()
    const events: string[] = []
    driver.registerStartListener(isTarget => events.push(`start:${isTarget}`))
    driver.registerSettleListener(isTarget => events.push(`settle:${isTarget}`))

    driver.snap(ctx)
    target(ctx, false)
    driver.snap(ctx)

    expect(events).toEqual(['settle:true', 'settle:false'])

    driver.reset()
  })

  test('a route flip after the last surface detaches neither crashes nor loses the morph', async () => {
    const target = atom(true, 'testDetachedFlipMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const ctx = createCtx()
    const mount = await renderHookWithProviders(() => useAtomMorphDriver(driver), { ctx })
    expect(driver.progress.value).toBe(1)

    await mount.unmount()
    // The last surface took its frame callback with it: the clock is parked.
    expect(countActiveMorphFrames()).toBe(0)

    // Switching away from /search flips the route atom while no surface owns a
    // frame callback. The still-attached subscription must only record the new
    // target; writing through a detached/misnamed handle is the web crash.
    await act(async () => {
      target(ctx, false)
    })
    expect(driver.progress.value).toBe(1)
    expect(countActiveMorphFrames()).toBe(0)

    const onSettle = jest.fn()
    driver.registerSettleListener(onSettle)
    await renderHookWithProviders(() => useAtomMorphDriver(driver), { ctx })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(driver.progress.value).toBe(0)
    expect(onSettle).toHaveBeenCalledWith(false)

    driver.reset()
  })

  test('a real flip after a snap still starts and settles normally', async () => {
    const target = atom(false, 'testFlipAfterSnapMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const ctx = createCtx()
    driver.snap(ctx)
    await renderHookWithProviders(() => useAtomMorphDriver(driver), { ctx })
    const events: string[] = []
    driver.registerStartListener(isTarget => events.push(`start:${isTarget}`))
    driver.registerSettleListener(isTarget => events.push(`settle:${isTarget}`))

    await act(async () => {
      target(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(events).toEqual(['start:true', 'settle:true'])

    driver.reset()
  })
})
