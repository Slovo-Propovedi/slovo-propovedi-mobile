import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { searchFocusMorphDriver } from 'widgets/search-island/@x/morphDrivers'
import {
  isSearchFieldFocusedAtom,
  isSearchOpenAtom,
  searchQueryAtom,
} from 'features/sermon-search/@x/barMorph'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import {
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'
import { tabIslandMorphDriver } from '../model/tabIslandMorphDriver'
import { ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'
import { useTabIslandMorph } from './useTabIslandMorph'

const mockedWithTiming = withTiming as jest.Mock
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

const MORPH_INPUT = { hideSearch: false, routeCount: 4, rowWidth: 390, windowWidth: 390 }

const captureCompletions = () => {
  const completions: Array<(finished: boolean) => void> = []
  mockedWithTiming.mockImplementation((toValue, _config, callback) => {
    if (typeof callback === 'function') completions.push(callback)
    return toValue
  })

  return completions
}

describe('useTabIslandMorph', () => {
  beforeEach(() => {
    tabIslandMorphDriver.reset()
    oneLineBarMorphDriver.reset()
    searchFocusMorphDriver.reset()
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('rests on the START shape while the morph is in flight, then the target', async () => {
    const completions = captureCompletions()
    const { ctx, result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT))

    await act(async () => {
      setBarCollapsed(ctx, true)
    })

    // Pointer gating must not lag: hidden slots stop receiving touches on the
    // flip itself, not when the geometry lands.
    expect(result.current.isCollapsed).toBe(true)
    // Committing the destination here paints the island at its final shape for
    // a frame, before Reanimated asserts the start-of-morph value (Issue #63).
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(result.current.restingContentStyle.paddingLeft).toBe(ISLAND_CONTENT_PADDING_HORIZONTAL)
    // The slots' resting layer reads the same settled flag (Issue #152).
    expect(result.current.settledCollapsed).toBe(false)
    expect(result.current.settledOneLine).toBe(false)

    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    // Both axes land: the shape is the circle and the height is the compact 48,
    // so the width (which equals the height) is 48 too.
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(result.current.restingContentStyle.paddingLeft).toBe(0)
    expect(result.current.settledCollapsed).toBe(true)
    expect(result.current.settledOneLine).toBe(true)
  })

  test('grows the circle 48 -> 68 when a visible field occupies the one-line row', async () => {
    const completions = captureCompletions()
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), { ctx })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      completions.forEach(complete => complete(true))
    })
    completions.length = 0

    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT)

    // A visible field forces the shape to stay collapsed but releases the
    // one-line height axis, so only the height driver runs.
    await act(async () => {
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'проповедь')
    })

    // Mid-morph the resting layer carries the START form: the one-line axis is
    // still settled at 48 until the grow lands.
    expect(result.current.settledOneLine).toBe(true)
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT)

    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    // Height and width settle together at the expanded circle diameter.
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(result.current.settledCollapsed).toBe(true)
    expect(result.current.settledOneLine).toBe(false)
  })

  test('fades the island out while the search field is focused', async () => {
    const completions = captureCompletions()
    const { ctx, result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT))

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })

    // Pointer gating follows the live atom; the resting layer still carries the
    // START shape until the morph lands.
    expect(result.current.isFocused).toBe(true)
    expect(result.current.restingIslandStyle.opacity).toBe(1)
    expect(result.current.restingIslandStyle.width).toBeGreaterThan(0)

    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    expect(result.current.restingIslandStyle.opacity).toBe(0)
    expect(result.current.restingIslandStyle.width).toBe(0)
  })

  test('keeps the island visible while the field is blurred', async () => {
    // Fresh ctx: the shared test context may carry focus from an earlier test.
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), { ctx })

    // Regression: nothing but real field focus may hide the island, so a dialog
    // opened over a blurred field leaves it in place.
    expect(result.current.isFocused).toBe(false)
    expect(result.current.restingIslandStyle.opacity).toBe(1)
    expect(result.current.restingIslandStyle.width).toBeGreaterThan(0)
  })

  test('seeds the resting shape from a collapsed bar at mount without animating', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    mockedWithTiming.mockClear()

    const { result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), { ctx })

    expect(result.current.isCollapsed).toBe(true)
    expect(result.current.settledCollapsed).toBe(true)
    expect(result.current.settledOneLine).toBe(true)
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })
})
