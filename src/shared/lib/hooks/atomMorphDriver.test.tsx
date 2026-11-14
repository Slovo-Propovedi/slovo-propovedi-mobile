import { atom, createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from '../../mocks/renderWithProviders'
import { createAtomMorphDriver } from './atomMorphDriver'
import { useAtomMorphDriver } from './useAtomMorphDriver'

const DURATION_MS = 300
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

describe('atomMorphDriver', () => {
  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

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
    mockedWithTiming.mockClear()
    const driver = createAtomMorphDriver({
      atom: atom(true, 'testSeededMorphAtom'),
      durationMs: DURATION_MS,
    })

    const { result } = await renderHookWithProviders(() => useAtomMorphDriver(driver))

    expect(driver.progress.value).toBe(1)
    expect(result.current.settled).toBe(true)
    expect(mockedWithTiming).not.toHaveBeenCalled()

    driver.reset()
  })

  test('starts one timing per flip and commits the start, then the target', async () => {
    const completions = captureCompletions()
    const target = atom(false, 'testFlippedMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const { ctx, result } = await renderHookWithProviders(() => useAtomMorphDriver(driver))

    await act(async () => {
      target(ctx, true)
    })

    expect(mockedWithTiming).toHaveBeenCalledTimes(1)
    expect(mockedWithTiming).toHaveBeenCalledWith(
      1,
      { duration: DURATION_MS },
      expect.any(Function),
    )
    // The shadow tree commits the START geometry until the timing lands.
    expect(result.current.settled).toBe(false)

    await act(async () => {
      completions[0](true)
    })

    expect(result.current.settled).toBe(true)
    expect(driver.progress.value).toBe(1)

    driver.reset()
  })

  test('snaps the shared value to the atom without animating', () => {
    mockedWithTiming.mockClear()
    const target = atom(true, 'testSnappedMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const ctx = createCtx()

    driver.snap(ctx)
    expect(driver.progress.value).toBe(1)

    target(ctx, false)
    driver.snap(ctx)
    expect(driver.progress.value).toBe(0)

    expect(mockedWithTiming).not.toHaveBeenCalled()

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

  test('a real flip after a snap still starts and settles normally', async () => {
    const target = atom(false, 'testFlipAfterSnapMorphAtom')
    const driver = createAtomMorphDriver({ atom: target, durationMs: DURATION_MS })
    const ctx = createCtx()
    driver.snap(ctx)
    driver.ensure(ctx)
    const events: string[] = []
    driver.registerStartListener(isTarget => events.push(`start:${isTarget}`))
    driver.registerSettleListener(isTarget => events.push(`settle:${isTarget}`))

    await act(async () => {
      target(ctx, true)
    })

    expect(events).toEqual(['start:true', 'settle:true'])
    expect(mockedWithTiming).toHaveBeenCalledTimes(1)

    driver.reset()
  })
})
