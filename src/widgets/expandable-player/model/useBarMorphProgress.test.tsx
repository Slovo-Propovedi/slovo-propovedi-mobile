import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search/@x/barMorph'
import { getSharedTestCtx } from 'shared/mocks'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { BAR_MORPH_DURATION_MS, setBarCollapsed } from 'shared/ui/layout'
import { resetBarMorphDriver } from './barMorphDriver'
import { useBarMorphProgress } from './useBarMorphProgress'

const mockedWithTiming = withTiming as jest.Mock
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

describe('useBarMorphProgress', () => {
  beforeEach(() => {
    resetBarMorphDriver()
    // Tests that omit a local ctx share one context, so the collapsed bar a
    // previous test left behind would make the next setBarCollapsed a no-op.
    setBarCollapsed(getSharedTestCtx(), false)
    mockedWithTiming.mockClear()
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('assigns the initial value without animating', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    const { result } = await renderHookWithProviders(() => useBarMorphProgress(), { ctx })

    expect(result.current.progress.value).toBe(1)
    expect(result.current.settledCollapsed).toBe(true)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('starts the morph when the bar atom collapses', async () => {
    const { ctx, result } = await renderHookWithProviders(() => useBarMorphProgress())

    mockedWithTiming.mockClear()

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    // The animation starts from the atom subscription, not from a render
    // effect: on Android the commit round trip delayed the visible morph.
    expect(mockedWithTiming).toHaveBeenCalledWith(
      1,
      { duration: BAR_MORPH_DURATION_MS },
      expect.any(Function),
    )
    expect(result.current.progress.value).toBe(1)
  })

  test('stays expanded when a collapsed bar still shows the search field', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'проповедь')

    const { ctx: hookCtx, result } = await renderHookWithProviders(() => useBarMorphProgress(), {
      ctx,
    })

    await act(async () => {
      setBarCollapsed(hookCtx, true)
    })

    expect(result.current.progress.value).toBe(0)
  })

  test('keeps the settled bar state until the morph completes', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })

    const { ctx, result } = await renderHookWithProviders(() => useBarMorphProgress())

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    // Committing the destination state at the flip paints the pill there for a
    // frame, before the animated layer asserts the start-of-morph value.
    expect(result.current.settledCollapsed).toBe(false)

    await act(async () => {
      completions[0](true)
    })

    expect(result.current.settledCollapsed).toBe(true)
  })

  test('commits the start state of a new flip that interrupts an in-flight morph', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })

    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    const { result } = await renderHookWithProviders(() => useBarMorphProgress(), { ctx })

    // Morph 1→0 (collapse → detached) starts; its start state is collapsed.
    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    expect(result.current.settledCollapsed).toBe(true)

    // Flip back to collapsed before morph 1 lands: the new animation starts
    // from the detached state, so the flag must commit that start immediately
    // instead of lagging behind with the previous settled value.
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    expect(result.current.settledCollapsed).toBe(false)

    // The interrupted animation reports no settle; the replacement owns the
    // commit.
    await act(async () => {
      completions[0](false)
    })
    expect(result.current.settledCollapsed).toBe(false)

    await act(async () => {
      completions[1](true)
    })
    expect(result.current.settledCollapsed).toBe(true)
  })
})
