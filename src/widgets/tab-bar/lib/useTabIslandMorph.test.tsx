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
  BAR_SIDE_INSET_EXPANDED,
  CONTENT_COLUMN_WIDTH,
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  WIDE_TAB_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'
import { tabIslandMorphDriver } from '../model/tabIslandMorphDriver'
import {
  ISLAND_CONTENT_PADDING_HORIZONTAL,
  WIDE_SEARCH_SLOT_WIDTH,
  WIDE_TAB_SLOT_WIDTH,
} from './getIslandStyle'
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

  test('hugs its content in the wide layout instead of spanning the column', async () => {
    // Fresh ctx: the shared test context may carry focus from an earlier test.
    const { result } = await renderHookWithProviders(
      () =>
        useTabIslandMorph({
          ...MORPH_INPUT,
          isForceExpanded: true,
          rowWidth: 1024,
          windowWidth: 1024,
        }),
      { ctx: createCtx() },
    )
    const naturalWidth =
      ISLAND_CONTENT_PADDING_HORIZONTAL * 2 + 3 * WIDE_TAB_SLOT_WIDTH + WIDE_SEARCH_SLOT_WIDTH
    const rowContentWidth = CONTENT_COLUMN_WIDTH - BAR_SIDE_INSET_EXPANDED * 2

    // Three label-only tabs plus the narrower icon-only search slot, with the
    // inner paddings: the wide island is a narrow pill, not the full column.
    expect(naturalWidth).toBe(332)
    expect(result.current.restingIslandStyle.width).toBe(naturalWidth)
    // The wide island is permanently pinned to the slim 48dp height.
    expect(result.current.restingIslandStyle.height).toBe(WIDE_TAB_ISLAND_HEIGHT)
    expect(naturalWidth).toBeLessThan(rowContentWidth)
    // Tabs keep the label pitch; search keeps only the touch target.
    expect(result.current.expandedTabWidth).toBe(WIDE_TAB_SLOT_WIDTH)
    expect(result.current.expandedSearchWidth).toBe(WIDE_SEARCH_SLOT_WIDTH)
  })

  test('shares the compact island equally between the tabs and the search tab', async () => {
    const ctx = createCtx()
    const { result } = await renderHookWithProviders(() => useTabIslandMorph(MORPH_INPUT), { ctx })
    const rowContentWidth =
      Math.min(MORPH_INPUT.rowWidth, CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2

    // Compact folds the search button into the island exactly like the wide
    // layout: the island takes the whole column and every slot — including the
    // search tab — gets the same share of the row padding.
    expect(result.current.restingIslandStyle.width).toBe(rowContentWidth)
    expect(result.current.expandedTabWidth).toBe(
      (rowContentWidth - ISLAND_CONTENT_PADDING_HORIZONTAL * 2) / 4,
    )

    // The collapsed target still shrinks to the active-tab circle.
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(result.current.settledCollapsed).toBe(true)
    expect(result.current.restingIslandStyle.width).toBe(TAB_BAR_ISLAND_HEIGHT)
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
