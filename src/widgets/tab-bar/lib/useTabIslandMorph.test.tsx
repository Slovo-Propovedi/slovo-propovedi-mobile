import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { searchFocusMorphDriver } from 'widgets/search-island/@x/morphDrivers'
import {
  isSearchFieldFocusedAtom,
  isSearchOpenAtom,
  searchQueryAtom,
} from 'features/sermon-search/@x/barMorph'
import { advanceMorphFrames, countActiveMorphFrames } from 'shared/mocks/morphFrames'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import {
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_OUTER_GAP,
  BAR_SIDE_INSET_EXPANDED,
  CONTENT_COLUMN_WIDTH,
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from 'shared/ui/layout'
import { MIN_TOUCH_TARGET } from 'shared/ui/theme'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'
import { tabIslandMorphDriver } from '../model/tabIslandMorphDriver'
import { ISLAND_CONTENT_PADDING_HORIZONTAL } from './getIslandStyle'
import { useTabIslandMorph } from './useTabIslandMorph'

const MORPH_INPUT = { hideSearch: false, routeCount: 3, rowWidth: 390, windowWidth: 390 }

describe('useTabIslandMorph', () => {
  beforeEach(() => {
    tabIslandMorphDriver.reset()
    oneLineBarMorphDriver.reset()
    searchFocusMorphDriver.reset()
  })

  test('rests on the START shape while the morph is in flight, then the target', async () => {
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
      advanceMorphFrames()
    })

    // Both axes land: the shape is the circle and the height is the compact 48,
    // so the width (which equals the height) is 48 too.
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(result.current.restingContentStyle.paddingLeft).toBe(0)
    expect(result.current.settledCollapsed).toBe(true)
    expect(result.current.settledOneLine).toBe(true)
  })

  test('grows the circle 48 -> 60 when a visible field occupies the one-line row', async () => {
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), { ctx })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

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
      advanceMorphFrames()
    })

    // Height and width settle together at the expanded circle diameter.
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(result.current.settledCollapsed).toBe(true)
    expect(result.current.settledOneLine).toBe(false)
  })

  test('fades the island out while the search field is focused', async () => {
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
      advanceMorphFrames()
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

  test('shares the expanded width across the three visible slots only', async () => {
    const three = createCtx()
    const four = createCtx()
    const visible = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), {
      ctx: three,
    })
    const withHidden = await renderHookWithProviders(
      () => useTabIslandMorph({ ...MORPH_INPUT, routeCount: 4 }),
      { ctx: four },
    )

    // The search route is registered in the navigator but never rendered as a
    // slot: routing the raw route count into the width would shrink every tab.
    expect(withHidden.result.current.expandedTabWidth).toBeLessThan(
      visible.result.current.expandedTabWidth,
    )
  })

  test('fills the column and reserves the in-island search slot in the wide layout', async () => {
    // Fresh ctx: the shared test context may carry focus from an earlier test.
    const { result } = await renderHookWithProviders(
      () => useTabIslandMorph({ ...MORPH_INPUT, isForceExpanded: true }),
      { ctx: createCtx() },
    )
    const rowContentWidth =
      Math.min(MORPH_INPUT.rowWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2

    // The wide search button lives INSIDE the island, so the island takes the
    // whole column instead of yielding a circle and gap to a separate island.
    expect(result.current.restingIslandStyle.width).toBe(rowContentWidth)
    // The tabs share what the row padding and the trailing search slot leave.
    expect(result.current.expandedTabWidth).toBe(
      (rowContentWidth - ISLAND_CONTENT_PADDING_HORIZONTAL * 2 - MIN_TOUCH_TARGET) / 3,
    )
  })

  test('keeps the separate search circle gap in the compact layout', async () => {
    const { result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), {
      ctx: createCtx(),
    })
    const rowContentWidth =
      Math.min(MORPH_INPUT.rowWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2

    // Compact still hands the separate search circle its diameter plus gap.
    expect(result.current.restingIslandStyle.width).toBe(
      rowContentWidth - BAR_CIRCLE_SIZE_EXPANDED - BAR_OUTER_GAP,
    )
  })

  test('seeds the resting shape from a collapsed bar at mount without animating', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)

    const { result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), { ctx })

    expect(result.current.isCollapsed).toBe(true)
    expect(result.current.settledCollapsed).toBe(true)
    expect(result.current.settledOneLine).toBe(true)
    expect(result.current.restingIslandStyle.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(countActiveMorphFrames()).toBe(0)
  })
})
