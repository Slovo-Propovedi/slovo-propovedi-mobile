import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, within } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import {
  searchCloseMorphDriver,
  searchFocusMorphDriver,
  searchOpenMorphDriver,
} from 'widgets/search-island/@x/morphDrivers'
import { tabIslandMorphDriver } from 'widgets/tab-bar/@x/morph'
import { isSearchFieldFocusedAtom, isSearchOpenAtom } from 'features/sermon-search/@x/barMorph'
import { advanceMorphFrames } from 'shared/mocks/morphFrames'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { showInfo } from 'shared/model/info-dialog'
import { getGlassBorder, getGlassFill, GLASS } from 'shared/ui'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_ROW_MIN_HEIGHT,
  BAR_SIDE_INSET_COLLAPSED,
  BAR_SIDE_INSET_EXPANDED,
  BAR_TOP_ISLAND_MARGIN,
  CONTENT_COLUMN_WIDTH,
  isBarCollapsedAtom,
  keyboardBottomInsetSv,
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  tabBarHeightAtom,
  WIDE_BAR_ROW_HEIGHT,
  WIDE_TAB_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { RADIUSES, themeModeAtom } from 'shared/ui/theme'
import {
  ISLAND_CONTENT_PADDING_HORIZONTAL,
  WIDE_SEARCH_SLOT_WIDTH,
  WIDE_TAB_LABEL_SIZE,
  WIDE_TAB_SLOT_WIDTH,
} from '../lib/getIslandStyle'
import { oneLineBarMorphDriver } from '../model/oneLineBarMorphDriver'
import { CustomTabBar } from './CustomTabBar'
import { styles } from './styles'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE } from './useTabPress'

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurView: (props: Record<string, unknown>) => <View {...props} /> }
})

const mockRouterNavigate = jest.fn()

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
  useRouter: () => ({ navigate: (...args: unknown[]) => mockRouterNavigate(...args) }),
}))

let mockBottomInset = 0
let mockTopInset = 0
let mockWindowWidth = 400
let mockWindowHeight = 800

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: mockWindowHeight, width: mockWindowWidth }),
}))

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({
      bottom: mockBottomInset,
      left: 0,
      right: 0,
      top: mockTopInset,
    }),
  }
})

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))
const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>

const mockOpenSearch = jest.fn()
const mockCloseSearch = jest.fn()
let mockIsSearchFieldVisible = false

jest.mock('features/sermon-search', () => ({
  focusSearchInput: jest.fn(),
  SearchBar: () => null,
  useCloseSearch: () => mockCloseSearch,
  useIsSearchFieldVisible: () => mockIsSearchFieldVisible,
  useOpenSearch: () => mockOpenSearch,
}))

const mockNavigate = jest.fn()

const createMockState = (activeIndex: number) => ({
  history: [{ key: 'listen', type: 'route' as const }],
  index: activeIndex,
  key: 'tab-root',
  preloadedRouteKeys: [] as string[],
  routeNames: ['listen', 'search', 'read', 'more'],
  routes: [
    { key: 'listen', name: 'listen', path: '/listen' },
    { key: 'search', name: 'search', path: '/search' },
    { key: 'read', name: 'read', path: '/read' },
    { key: 'more', name: 'more', path: '/more' },
  ],
  stale: false as const,
  type: 'tab' as const,
})

const createMockEmitter = () =>
  ({
    emit: jest.fn(() => ({ defaultPrevented: false })),
  }) as unknown as Parameters<typeof CustomTabBar>[0]['emitter']

const renderTabBar = async (
  activeIndex = 0,
  { hideSearch, isCollapsed = false }: { hideSearch?: boolean; isCollapsed?: boolean } = {},
) => {
  const state = createMockState(activeIndex)
  const emitter = createMockEmitter()
  const ctx = createCtx()

  if (isCollapsed) setBarCollapsed(ctx, true)

  return renderWithProviders(
    <CustomTabBar
      state={state}
      descriptors={{}}
      emitter={emitter}
      hideSearch={hideSearch}
      navigateToTab={mockNavigate}
      insets={{ bottom: 0, left: 0, right: 0, top: mockTopInset }}
    />,
    { ctx },
  )
}

const TAB_ISLAND_NOT_FOUND = 'tab island not found'
const SEARCH_BUTTON_NOT_FOUND = 'search button host not found'

describe('<CustomTabBar>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBottomInset = 0
    mockTopInset = 0
    mockWindowWidth = 400
    mockWindowHeight = 800
    mockIsSearchFieldVisible = false
    tabIslandMorphDriver.reset()
    oneLineBarMorphDriver.reset()
    searchOpenMorphDriver.reset()
    searchFocusMorphDriver.reset()
    searchCloseMorphDriver.reset()
  })

  const findIslandsRow = () => {
    const contentHeights = [
      BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN,
      WIDE_BAR_ROW_HEIGHT + BAR_BOTTOM_INSET_MIN,
    ]

    return screen.root?.queryAll(
      instance =>
        typeof instance.props.onLayout === 'function' &&
        contentHeights.includes(StyleSheet.flatten(instance.props.style)?.height),
    )[0]
  }

  const findIslandsRowAtHeight = (rowHeight: number) =>
    screen.root?.queryAll(
      instance =>
        typeof instance.props.onLayout === 'function' &&
        StyleSheet.flatten(instance.props.style)?.height === rowHeight,
    )[0]

  const fireLayout = async (height: number, width: number) => {
    const row = findIslandsRow()

    if (!row) throw new Error('islands row not found')

    await fireEvent(row, 'layout', { nativeEvent: { layout: { height, width, x: 0, y: 0 } } })
  }

  const findGlassBlurs = () =>
    screen.root?.queryAll(instance => instance.props.intensity === GLASS.blur.intensity) ?? []

  const findFill = (color: string) =>
    screen.root?.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.backgroundColor === color,
    ) ?? []

  const findHairlineBorders = (color: string) =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.borderColor === color && flat?.borderWidth === 1
    }) ?? []

  const findSearchCircle = () =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.height === BAR_CIRCLE_SIZE_EXPANDED && flat?.width === BAR_CIRCLE_SIZE_EXPANDED
    })[0]

  const findFloatingContainer = () =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return (
        flat?.position === 'absolute' &&
        flat?.zIndex === 10 &&
        flat?.bottom === 0 &&
        flat?.left === 0 &&
        flat?.right === 0
      )
    })[0]

  const findTopAnchoredFloatingContainer = () =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.position === 'absolute' && flat?.zIndex === 10 && typeof flat?.top === 'number'
    })[0]

  const findTabIsland = () =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.borderRadius === RADIUSES.round && flat?.maxWidth === 600
    })[0]

  // The detached search button is the column-layer host that carries the moving
  // geometry: absolute, raised above the island, and positioned by `right`
  // inside the same natively-centred column as the island (no live-window left).
  const findSearchButtonHost = (): TestInstance | undefined =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return (
        flat?.position === 'absolute' &&
        flat?.zIndex === 20 &&
        flat?.alignItems === undefined &&
        flat?.flexDirection === undefined &&
        typeof flat?.right === 'number'
      )
    })[0]

  const searchGlassOpacity = () => {
    const host = findSearchButtonHost()

    if (!host) throw new Error(SEARCH_BUTTON_NOT_FOUND)

    // The glass is the only absolute-fill child carrying an animated opacity in
    // the expanded state (the label text has no `top`, the capsule sits inset).
    const glass = host.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.top === 0 && typeof flat?.opacity === 'number'
    })[0]

    return StyleSheet.flatten(glass?.props.style)?.opacity
  }

  const findMovingCapsule = () => {
    const host = findSearchButtonHost()

    if (!host) throw new Error(SEARCH_BUTTON_NOT_FOUND)

    return host.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.backgroundColor === CAPSULE_COLOR && flat?.top === 4
    })[0]
  }

  // The chrome lays out in the orientation-independent base (the window's short
  // side, capped by the content column), never the live width.
  const layoutBase = () => Math.min(mockWindowWidth, mockWindowHeight)

  // In-island slot rect of the compact expanded row: the oracle the detached
  // button must start from. The row is centred in the content column with the
  // expanded side inset and the inner content padding.
  const expandedSlotRect = () => {
    const rowContentWidth =
      Math.min(layoutBase(), CONTENT_COLUMN_WIDTH) - BAR_SIDE_INSET_EXPANDED * 2
    const slotWidth = (rowContentWidth - ISLAND_CONTENT_PADDING_HORIZONTAL * 2) / 4

    return {
      left: BAR_SIDE_INSET_EXPANDED + ISLAND_CONTENT_PADDING_HORIZONTAL + 3 * slotWidth,
      right: BAR_SIDE_INSET_EXPANDED + ISLAND_CONTENT_PADDING_HORIZONTAL,
      width: slotWidth,
    }
  }

  // Independent oracle for the closed circle at a given one-line progress.
  const closedCircleRect = (oneLine: number) => {
    const sideInset =
      BAR_SIDE_INSET_EXPANDED + (BAR_SIDE_INSET_COLLAPSED - BAR_SIDE_INSET_EXPANDED) * oneLine
    const height =
      TAB_BAR_ISLAND_HEIGHT +
      (TAB_BAR_ISLAND_HEIGHT_EXPANDED - TAB_BAR_ISLAND_HEIGHT) * (1 - oneLine)

    return {
      height,
      left: sideInset + layoutBase() - sideInset * 2 - height,
      right: sideInset,
      width: height,
    }
  }

  test('derives the tab-bar height instead of waiting for a layout pass', async () => {
    const { ctx } = await renderTabBar()

    // BAR_ROW_MIN_HEIGHT + the inset-less floor, same value the row uses.
    expect(ctx.get(tabBarHeightAtom)).toBe(BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN)
  })

  test('a real safe-area inset updates the height in the same render as the row padding', async () => {
    mockBottomInset = 34
    const { ctx } = await renderTabBar()

    expect(ctx.get(tabBarHeightAtom)).toBe(BAR_ROW_MIN_HEIGHT + 34)
    expect(findIslandsRowAtHeight(BAR_ROW_MIN_HEIGHT + 34)).toBeDefined()
  })

  test('ignores a zero-height layout report', async () => {
    const { ctx } = await renderTabBar()

    await fireLayout(0, 0)

    expect(ctx.get(tabBarHeightAtom)).toBe(BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN)
  })

  test('a layout taller than the derived height wins as a floor guard', async () => {
    const { ctx } = await renderTabBar()

    await fireLayout(140, 320)

    expect(ctx.get(tabBarHeightAtom)).toBe(140)
  })

  test('holds the portrait chrome width through a rotation', async () => {
    mockWindowWidth = 390
    mockWindowHeight = 844
    const props = createBarProps()
    const { rerender } = await renderWithProviders(
      <CustomTabBar state={createMockState(0)} {...props} />,
      { ctx: createCtx() },
    )

    // A real layout pass pins the row at the portrait width.
    await fireLayout(BAR_ROW_MIN_HEIGHT, mockWindowWidth)

    const portraitWidth = layoutBase() - BAR_SIDE_INSET_EXPANDED * 2

    expect(portraitWidth).toBe(340)
    expect(StyleSheet.flatten(findTabIsland()?.props.style)?.width).toBe(portraitWidth)

    mockWindowWidth = 844
    mockWindowHeight = 390
    await act(async () => {
      rerender(<CustomTabBar state={createMockState(0)} {...props} />)
    })

    // The width base is the window's short side, so a rotation changes no size:
    // the island keeps the portrait width and only its (native) centring moves.
    // Re-deriving the width from the live landscape window would make every
    // JS-derived piece of chrome chase the native relayout for a frame.
    expect(StyleSheet.flatten(findTabIsland()?.props.style)?.width).toBe(portraitWidth)
    // The row is the base-wide canvas: it is centred by the full-width
    // container's native layout, not by a JS-computed offset.
    expect(StyleSheet.flatten(findIslandsRow()?.props.style)?.maxWidth).toBe(layoutBase())
    expect(StyleSheet.flatten(findFloatingContainer()?.props.style)?.alignItems).toBe('center')

    // Rotating back changes nothing either.
    mockWindowWidth = 390
    mockWindowHeight = 844
    await act(async () => {
      rerender(<CustomTabBar state={createMockState(0)} {...props} />)
    })

    expect(StyleSheet.flatten(findTabIsland()?.props.style)?.width).toBe(portraitWidth)
  })

  test('caps the floating island to the 600px content column', async () => {
    await renderTabBar()

    // Literal 600 (not the constant) guards against regressing to the web-only cap,
    // which is `undefined` under the native jest environment.
    expect(styles.floatingIsland.maxWidth).toBe(600)
  })

  test('leaves the islands row side inset to the animated style', async () => {
    await renderTabBar()

    // The side inset is not static: useRowInsetStyle animates it between the
    // expanded and the one-line values as longhand paddings (an animated
    // `paddingHorizontal` never reaches the web DOM). The 25/36 values live in
    // useRowInsetStyle.test.ts.
    expect(styles.islandsRow).toMatchObject({ maxWidth: 600 })
    expect(styles.islandsRow).not.toHaveProperty('paddingHorizontal')
    expect(styles.islandsRow).not.toHaveProperty('paddingLeft')
    expect(styles.islandsRow).not.toHaveProperty('paddingRight')
  })

  test('floors the bottom inset at 12 so the islands sit low without a system inset', async () => {
    await renderTabBar()

    // Literal 12 (not the constant) guards the small bottom gap.
    expect(findIslandsRowAtHeight(BAR_ROW_MIN_HEIGHT + 12)).toBeDefined()
  })

  test('lifts the row exactly to the safe-area line on 3-button navigation', async () => {
    mockBottomInset = 48
    await renderTabBar()

    expect(findIslandsRowAtHeight(BAR_ROW_MIN_HEIGHT + 48)).toBeDefined()
  })

  test('sits flush on the safe-area line for a real inset below the floor', async () => {
    // A small real inset (gesture nav on some devices) must place the islands
    // exactly on the safe-area line, without the extra floor distance.
    mockBottomInset = 8
    await renderTabBar()

    expect(findIslandsRowAtHeight(BAR_ROW_MIN_HEIGHT + 8)).toBeDefined()
  })

  test('renders the expanded island at the expanded height', async () => {
    await renderTabBar()

    const island = screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.borderRadius === RADIUSES.round && flat?.maxWidth === 600
    })[0]

    expect(StyleSheet.flatten(island?.props.style)).toMatchObject({
      height: TAB_BAR_ISLAND_HEIGHT_EXPANDED,
    })
  })

  test('leaves the island height to the animated morph instead of a static fallback', () => {
    // A static height in the island's style array shadows the animated one on
    // device: the expanded island stays pinned to the collapsed 48 and renders
    // visibly shorter than the 60 search circle next to it.
    expect(styles.floatingIsland).not.toHaveProperty('height')
  })

  test('clips the tab content inside the morphing pill, not the glass host', () => {
    // Issue #152: on iPad Safari the slot animated styles can freeze at the
    // expanded geometry mid-morph while the island shrinks, so the clip must
    // live on the inner content wrapper — frozen tabs then cannot paint
    // outside the pill. The glass surface clips itself (GlassSurface), so the
    // host carries no overflow at all (same structure as the search circle).
    expect(styles.floatingIsland).not.toHaveProperty('overflow')
    expect(styles.islandContent).toMatchObject({
      borderRadius: RADIUSES.round,
      overflow: 'hidden',
    })
  })

  test('frosts the tab island and its detached search button', async () => {
    await renderTabBar()

    const blurs = findGlassBlurs()

    // Island + the moving search button's own glass (invisible on the island,
    // but always mounted so the tear-off carries a real surface).
    expect(blurs).toHaveLength(2)
    expect(blurs.every(blur => blur.props.tint === 'light')).toBe(true)
    // The fill is a layer ABOVE the blur: the native snapshot is opaque, so a
    // backgroundColor underneath it would never show through.
    expect(findFill(getGlassFill(true))).toHaveLength(2)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)?.backgroundColor).toBeUndefined()
    expect(findHairlineBorders(getGlassBorder(true))).toHaveLength(2)
  })

  test('renders the glass island without its own shadow', async () => {
    await renderTabBar()

    const island = screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.borderRadius === RADIUSES.round && flat?.maxWidth === 600
    })[0]

    // The island host itself must stay shadowless.
    expect(StyleSheet.flatten(island?.props.style)).not.toHaveProperty('boxShadow')
  })

  test('uses the dark glass recipe in the dark theme', async () => {
    const { ctx } = await renderTabBar()
    await act(async () => {
      themeModeAtom(ctx, 'dark')
    })

    const blurs = findGlassBlurs()

    expect(blurs).toHaveLength(2)
    expect(blurs.every(blur => blur.props.tint === 'dark')).toBe(true)
    expect(findFill(getGlassFill(false))).toHaveLength(2)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)?.backgroundColor).toBeUndefined()
    expect(findHairlineBorders(getGlassBorder(false))).toHaveLength(2)
  })

  // The clipping wrapper (Issue #152) has no padding now: the animated inset
  // lives on the slot row inside it, so the absolute traveling capsule shares
  // one coordinate origin across native and web.
  const findSlotsRow = () =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.flex === 1 && flat?.flexDirection === 'row'
    })[0]

  test('insets the island content so the tabs clear the rounded edges', async () => {
    await renderTabBar()

    expect(StyleSheet.flatten(findSlotsRow()?.props.style)).toMatchObject({
      paddingLeft: 10,
      paddingRight: 10,
    })
  })

  test('collapsed circle drops the content padding so the active slot fills it', async () => {
    // A `paddingHorizontal` animated style never reaches the web DOM: Reanimated
    // updates styles through createReactDOMStyle, skipping the react-native-web
    // preprocess step that expands shortforms. The 8dp inset then freezes and
    // pushes the 48dp active slot past the circle's right edge.
    await renderTabBar(0, { isCollapsed: true })

    expect(StyleSheet.flatten(findSlotsRow()?.props.style)).toMatchObject({
      paddingLeft: 0,
      paddingRight: 0,
    })
  })

  test('stops the tab island from receiving touches while the search field is focused', async () => {
    const { ctx } = await renderTabBar()
    const findIsland = () =>
      screen.root?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.borderRadius === RADIUSES.round && flat?.maxWidth === 600
      })[0]

    // Idle, the glass host passes drags through to the list between its buttons.
    expect(findIsland()?.props.pointerEvents).toBe('box-none')

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })

    expect(findIsland()?.props.pointerEvents).toBe('none')
  })

  test('gates the floating chrome so drags beside the islands reach the list', async () => {
    await renderTabBar()

    const container = findFloatingContainer()
    const islandsRow = findIslandsRow()

    // Both layers only position the interactive islands; the strip around them
    // belongs to the scroll content underneath.
    expect(container?.props.pointerEvents).toBe('box-none')
    expect(islandsRow?.props.pointerEvents).toBe('box-none')
  })

  test('renders the registered search route as one search tab, never as a routed slot', async () => {
    const routeNames = ['listen', 'search', 'read', 'more', 'history', 'share']
    const state = {
      ...createMockState(0),
      routeNames,
      routes: routeNames.map(name => ({ key: name, name, path: `/${name}` })),
    }

    const { getByText } = await renderWithProviders(
      <CustomTabBar
        state={state}
        descriptors={{}}
        navigateToTab={mockNavigate}
        emitter={createMockEmitter()}
        insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
      />,
      { ctx: createCtx() },
    )

    // Search is registered as a navigator route (it owns its detail stack) and
    // now renders exactly one «Поиск» tab affordance; the remaining routes keep
    // their regular slots.
    expect(getByText('Поиск')).toBeTruthy()
    expect(getByText('Слушать')).toBeTruthy()
    expect(getByText('Читать')).toBeTruthy()
    expect(getByText('Ещё')).toBeTruthy()
    expect(getByText('history')).toBeTruthy()
    expect(getByText('share')).toBeTruthy()
  })

  test('marks the active tab with a capsule and primary tint', async () => {
    const { getByText } = await renderTabBar(0)

    const capsules = screen.root?.queryAll(
      instance =>
        StyleSheet.flatten(instance.props.style)?.backgroundColor === 'rgba(241, 96, 49, 0.18)',
    )

    expect(getByText('Слушать')).toHaveStyle({ color: '#f16031' })
    expect(capsules).toHaveLength(1)
    expect(getByText('Ещё')).not.toHaveStyle({ color: '#f16031' })
  })

  const findTravelCapsules = (island: TestInstance) =>
    island.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.backgroundColor === CAPSULE_COLOR,
    )

  test('keeps exactly one traveling capsule in the island row', async () => {
    await renderTabBar(0)

    const island = findTabIsland()

    if (!island) throw new Error(TAB_ISLAND_NOT_FOUND)

    // One element owns the expanded highlight; the per-slot capsules are gone.
    expect(findTravelCapsules(island)).toHaveLength(1)
    expect(island.queryAll(isVisibleCapsuleNode)).toHaveLength(1)
  })

  test('slides the capsule onto the destination tab in the wide top island', async () => {
    mockWindowWidth = 1024
    const props = createBarProps()
    const { rerender } = await renderWithProviders(
      <CustomTabBar state={createMockState(0)} {...props} />,
      { ctx: createCtx() },
    )

    await act(async () => {
      rerender(<CustomTabBar state={createMockState(3)} {...props} />)
    })
    await act(async () => {
      advanceMorphFrames(10)
    })

    const island = findTabIsland()

    if (!island) throw new Error(TAB_ISLAND_NOT_FOUND)

    // Wide slot centres are 44, 132, 220 and 288: «Ещё» rests the 100dp
    // capsule at 220 - 50.
    expect(findTravelCapsules(island)[0]).toHaveStyle({ transform: [{ translateX: 180 }] })
  })

  test('fades the traveling capsule out while the island collapses', async () => {
    const ctx = createCtx()
    await renderWithProviders(<CustomTabBar state={createMockState(0)} {...createBarProps()} />, {
      ctx,
    })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const island = findTabIsland()

    if (!island) throw new Error(TAB_ISLAND_NOT_FOUND)

    expect(findTravelCapsules(island)[0]).toHaveStyle({ opacity: 0 })
  })

  test('rests the search button on the expanded island slot', async () => {
    await renderTabBar()
    const slot = expandedSlotRect()
    const button = StyleSheet.flatten(findSearchButtonHost()?.props.style)

    // Expanded: the button covers the in-island slot exactly, with its own
    // glass invisible on the island's glass.
    expect(button?.right).toBe(slot.right)
    expect(button?.width).toBe(slot.width)
    expect(searchGlassOpacity()).toBe(0)
  })

  test('detaches the search button onto its own circle once the bar folds', async () => {
    const { ctx } = await renderTabBar()

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const button = StyleSheet.flatten(findSearchButtonHost()?.props.style)

    // Folded: the button owns the circle rect and carries its own glass.
    expect(button?.right).toBe(closedCircleRect(1).right)
    expect(button?.width).toBe(closedCircleRect(1).width)
    expect(searchGlassOpacity()).toBe(1)
  })

  test('tears the search button off the island across the collapse morph', async () => {
    const ctx = createCtx()
    const props = createBarProps()
    const { rerender } = await renderWithProviders(
      <CustomTabBar state={createMockState(0)} {...props} />,
      { ctx },
    )
    const slot = expandedSlotRect()
    const expanded = StyleSheet.flatten(findSearchButtonHost()?.props.style)

    expect(expanded?.right).toBe(slot.right)
    expect(expanded?.width).toBe(slot.width)
    // Inside the island its own glass must be invisible: it sits on the island's.
    expect(searchGlassOpacity()).toBe(0)

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames(1)
    })
    // Force the style layer to read the mid-flight shared value (the jest
    // reanimated mock evaluates animated styles on render, not on the UI thread).
    await rerender(<CustomTabBar state={createMockState(0)} {...props} />)

    const mid = StyleSheet.flatten(findSearchButtonHost()?.props.style)
    const midCircle = closedCircleRect(0.5)

    expect(mid?.right).toBe((slot.right + midCircle.right) / 2)
    expect(mid?.width).toBe((slot.width + midCircle.width) / 2)
    expect(mid?.right).toBeLessThan(slot.right)
    expect(searchGlassOpacity()).toBe(0.5)

    await act(async () => {
      advanceMorphFrames()
    })

    const collapsed = StyleSheet.flatten(findSearchButtonHost()?.props.style)
    const circle = closedCircleRect(1)

    expect(collapsed?.right).toBe(circle.right)
    expect(collapsed?.width).toBe(circle.width)
    expect(searchGlassOpacity()).toBe(1)
  })

  test('glues the search button back into the island across the expand morph', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    const props = createBarProps()
    const { rerender } = await renderWithProviders(
      <CustomTabBar state={createMockState(0)} {...props} />,
      { ctx },
    )
    const collapsed = StyleSheet.flatten(findSearchButtonHost()?.props.style)

    expect(collapsed?.right).toBe(closedCircleRect(1).right)
    expect(searchGlassOpacity()).toBe(1)

    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    await act(async () => {
      advanceMorphFrames(1)
    })
    await rerender(<CustomTabBar state={createMockState(0)} {...props} />)

    const mid = StyleSheet.flatten(findSearchButtonHost()?.props.style)
    const slot = expandedSlotRect()
    const midCircle = closedCircleRect(0.5)

    expect(mid?.right).toBe((slot.right + midCircle.right) / 2)
    expect(mid?.right).toBeLessThan(collapsed?.right as number)
    expect(searchGlassOpacity()).toBe(0.5)

    await act(async () => {
      advanceMorphFrames()
    })

    const expanded = StyleSheet.flatten(findSearchButtonHost()?.props.style)

    expect(expanded?.right).toBe(slot.right)
    expect(expanded?.width).toBe(slot.width)
    expect(searchGlassOpacity()).toBe(0)
  })

  test('lands the detached search button on the circle the collapsed pill clears', async () => {
    const ctx = createCtx()
    await renderWithProviders(<CustomTabBar state={createMockState(0)} {...createBarProps()} />, {
      ctx,
    })

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const collapsed = StyleSheet.flatten(findSearchButtonHost()?.props.style)

    // The collapsed mini pill starts at circle + BAR_OUTER_GAP from the row's
    // inner left edge, so the arriving circle must own the row's inner right
    // edge (the `getMiniPlayerGeometry` invariant).
    expect(collapsed?.width).toBe(closedCircleRect(1).width)
    expect(collapsed?.right).toBe(BAR_SIDE_INSET_COLLAPSED)
  })

  test('centres the search circle in the same native column as the island on rotation', async () => {
    mockWindowWidth = 390
    mockWindowHeight = 844
    const props = createBarProps()
    const { rerender } = await renderWithProviders(
      <CustomTabBar state={createMockState(0)} {...props} />,
      { ctx: createCtx() },
    )
    const portraitHost = findSearchButtonHost()

    if (!portraitHost) throw new Error(SEARCH_BUTTON_NOT_FOUND)

    const portrait = StyleSheet.flatten(portraitHost.props.style)
    const portraitColumn = StyleSheet.flatten(portraitHost.parent?.props.style)

    // The circle is positioned by `right` inside the same 390-wide, natively
    // centred column the islands row uses — never by an absolute left derived
    // from the live window width.
    expect(portrait).not.toHaveProperty('left')
    expect(portraitColumn?.maxWidth).toBe(390)

    mockWindowWidth = 844
    mockWindowHeight = 390
    await act(async () => {
      rerender(<CustomTabBar state={createMockState(0)} {...props} />)
    })

    const rotatedHost = findSearchButtonHost()

    if (!rotatedHost) throw new Error(SEARCH_BUTTON_NOT_FOUND)

    expect(StyleSheet.flatten(rotatedHost.props.style)?.right).toBe(portrait?.right)
    expect(StyleSheet.flatten(rotatedHost.parent?.props.style)?.maxWidth).toBe(390)
  })

  test('keeps the search affordance inside the wide island', async () => {
    mockWindowWidth = 1024
    const { getByRole } = await renderTabBar()
    const island = findTabIsland()

    if (!island) throw new Error(TAB_ISLAND_NOT_FOUND)

    // Wide pins separation to 0: no detached row-layer host, the slot stays put.
    expect(findSearchButtonHost()).toBeUndefined()
    expect(within(island).getByRole('button', { name: 'Поиск' })).toBeTruthy()
    expect(getByRole('button', { name: 'Поиск' })).toBeTruthy()
  })

  test('keeps the active search capsule on the detached button', async () => {
    const ctx = createCtx()
    await renderWithProviders(<CustomTabBar state={createMockState(1)} {...createBarProps()} />, {
      ctx,
    })

    // Expanded: the island's traveling capsule owns the highlight.
    expect(StyleSheet.flatten(findMovingCapsule()?.props.style)?.opacity).toBe(0)

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(StyleSheet.flatten(findMovingCapsule()?.props.style)?.opacity).toBe(1)
  })

  test('hides the search button on the admin tab layout', async () => {
    const { queryByRole } = await renderTabBar(0, { hideSearch: true })

    expect(queryByRole('button', { name: 'Поиск' })).toBeNull()
  })

  test('keeps one mounted search button through the collapse morph', async () => {
    const { ctx } = await renderTabBar()

    expect(
      screen.root?.queryAll(instance => instance.props.accessibilityLabel === 'Поиск'),
    ).toHaveLength(1)

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(
      screen.root?.queryAll(instance => instance.props.accessibilityLabel === 'Поиск'),
    ).toHaveLength(1)
  })

  test('does not paint its own search-button shadow', async () => {
    await renderTabBar()
    const host = findSearchButtonHost()

    if (!host) throw new Error(SEARCH_BUTTON_NOT_FOUND)

    expect(
      host.queryAll(instance => StyleSheet.flatten(instance.props.style)?.boxShadow !== undefined),
    ).toHaveLength(0)
  })

  test('shows the search button in the collapsed bar', async () => {
    const { getByRole } = await renderTabBar(0, { isCollapsed: true })

    expect(getByRole('button', { name: 'Поиск' })).toBeTruthy()
  })

  test('pressing the search button opens the search route', async () => {
    const { getByRole } = await renderTabBar()

    await fireEvent.press(getByRole('button', { name: 'Поиск' }))

    expect(mockOpenSearch).toHaveBeenCalledTimes(1)
  })

  test('tapping a disabled tab shows info dialog and does not navigate', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Читать'))

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('tapping an allowed inactive tab navigates to that route', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Ещё'))

    expect(mockNavigate).toHaveBeenCalledWith('more')
  })

  test('keeps hidden tab buttons non-interactive inside the collapsed circle', async () => {
    const { getByText } = await renderTabBar(0, { isCollapsed: true })

    // Zero-width slots still render their pressable children (overflow), so
    // without a pointer-events gate the invisible «Ещё» button steals taps on
    // the circle's right edge.
    await fireEvent.press(getByText('Ещё'))

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('expands the collapsed bar when the active tab circle is pressed', async () => {
    const { ctx, getByText } = await renderTabBar(0, { isCollapsed: true })

    await fireEvent.press(getByText('Слушать'))

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('does not show info dialog when tapping an active allowed tab', async () => {
    const { getByText } = await renderTabBar(3)

    await fireEvent.press(getByText('Ещё'))

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('renders the disabled tab button with reduced opacity', async () => {
    const { getByText } = await renderTabBar(0)

    const readButton = getByText('Читать')
    // Disabled tabs should have a TouchableButton ancestor with disabledTabButton style
    const touchable = readButton.parent?.parent
    expect(touchable).toHaveStyle({ opacity: 0.5 })
  })

  test('lifts the whole floating chrome by the keyboard height', async () => {
    keyboardBottomInsetSv.value = 280

    try {
      await renderTabBar()

      const container = screen.root?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.position === 'absolute' && flat?.zIndex === 10
      })[0]

      expect(StyleSheet.flatten(container?.props.style)).toMatchObject({
        transform: [{ translateY: -280 }],
      })
    } finally {
      keyboardBottomInsetSv.value = 0
    }
  })

  test('anchors the floating chrome to the safe-area top in the wide layout', async () => {
    mockWindowWidth = 768
    mockTopInset = 20
    await renderTabBar()

    const container = findTopAnchoredFloatingContainer()

    // The wide layout floats the island at the top of the screen (Apple Music
    // iPad style) instead of hugging the bottom edge.
    expect(StyleSheet.flatten(container?.props.style)).toMatchObject({
      top: 20 + BAR_TOP_ISLAND_MARGIN,
    })
    expect(StyleSheet.flatten(container?.props.style)?.bottom).toBeUndefined()
  })

  test('floats the wide chrome on plain glass without a full-row backing', async () => {
    mockWindowWidth = 1024
    mockTopInset = 20
    await renderTabBar()

    const container = findTopAnchoredFloatingContainer()
    const row = findIslandsRow()
    const island = findTabIsland()

    // The top wrapper only positions the island: any fill/tint here would paint
    // a full-width backing under the glass instead of a floating pill.
    expect(StyleSheet.flatten(container?.props.style)?.backgroundColor).toBeUndefined()
    expect(StyleSheet.flatten(container?.props.style)?.alignItems).toBe('center')
    // The raised shadow belongs to the pill, never to the full-width row: a
    // row-level elevation projected a flat band beneath the island on Android.
    expect(StyleSheet.flatten(row?.props.style)?.elevation).toBeUndefined()
    expect(StyleSheet.flatten(island?.props.style)?.elevation).toBe(12)
  })

  test('keeps the island expanded while the bar is collapsed in the wide layout', async () => {
    mockWindowWidth = 1024
    await renderTabBar(0, { isCollapsed: true })

    expect(StyleSheet.flatten(findTabIsland()?.props.style)).toMatchObject({
      height: WIDE_TAB_ISLAND_HEIGHT,
    })
    expect(StyleSheet.flatten(findTabIsland()?.props.style)?.width).toBeGreaterThan(
      BAR_CIRCLE_SIZE_EXPANDED,
    )
    expect(StyleSheet.flatten(findSlotsRow()?.props.style)).toMatchObject({
      paddingLeft: 10,
      paddingRight: 10,
    })
  })

  test('does not lift the floating chrome above the keyboard in the wide layout', async () => {
    mockWindowWidth = 1024
    keyboardBottomInsetSv.value = 280

    try {
      await renderTabBar()

      const container = findTopAnchoredFloatingContainer()

      expect(container).toBeDefined()
      // The layout-shift layer is the ONLY transform in wide: the keyboard lift
      // is not applied there, so its translateY stays at the rest zero.
      expect(StyleSheet.flatten(container?.props.style)?.transform).toEqual([{ translateY: 0 }])
    } finally {
      keyboardBottomInsetSv.value = 0
    }
  })

  test('carries the layout-shift transform into the wide floating container', async () => {
    mockWindowWidth = 1024
    await renderTabBar()

    const container = findTopAnchoredFloatingContainer()

    // The shift wrapper is present in wide and rests at zero; the slide
    // distance and its timing are pinned by useChromeLayoutShift's own suite.
    expect(StyleSheet.flatten(container?.props.style)?.transform).toEqual([{ translateY: 0 }])
  })

  // Wide needs a tablet-class shortest side (600) AND a tablet-class longest
  // side (768), so compact windows include both a narrow portrait frame and a
  // phone in landscape (844×390) whose long side crosses 768 on its own.
  test.each([
    { height: 599, label: 'narrow window just below the breakpoint', width: 767 },
    { height: 390, label: 'phone in landscape', width: 844 },
  ])(
    'keeps the bottom anchor and collapse morph on a compact window — $label',
    async ({ height, width }) => {
      mockWindowWidth = width
      mockWindowHeight = height
      await renderTabBar(0, { isCollapsed: true })

      expect(findFloatingContainer()).toBeDefined()
      expect(StyleSheet.flatten(findFloatingContainer()?.props.style)?.top).toBeUndefined()
      expect(StyleSheet.flatten(findTabIsland()?.props.style)).toMatchObject({
        height: TAB_BAR_ISLAND_HEIGHT,
      })
    },
  )

  test('renders the wide search button inside the tab island, not as a separate circle', async () => {
    mockWindowWidth = 1024
    const { getByRole } = await renderTabBar()

    // The separate glass search island is gone in wide: the tab island is the
    // only glass surface and the magnifier trails the tabs inside it.
    expect(findSearchCircle()).toBeUndefined()
    expect(findGlassBlurs()).toHaveLength(1)
    expect(getByRole('button', { name: 'Поиск' })).toBeTruthy()
  })

  test('pressing the in-island search button in the wide layout opens the search route', async () => {
    mockWindowWidth = 1024
    const { getByRole } = await renderTabBar()

    await fireEvent.press(getByRole('button', { name: 'Поиск' }))

    expect(mockOpenSearch).toHaveBeenCalledTimes(1)
  })

  test('hides the in-island search button on the wide admin layout', async () => {
    mockWindowWidth = 1024
    const { queryByRole } = await renderTabBar(0, { hideSearch: true })

    expect(queryByRole('button', { name: 'Поиск' })).toBeNull()
  })

  const createBarProps = () => ({
    descriptors: {},
    emitter: createMockEmitter(),
    insets: { bottom: 0, left: 0, right: 0, top: 0 },
    navigateToTab: mockNavigate,
  })

  // Tab slots are the only morphed nodes carrying both a numeric width and a
  // minWidth: the always-mounted close button also has minWidth, but its width
  // is a percentage.
  const findTabSlots = () =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.minWidth !== undefined && typeof flat?.width === 'number'
    }) ?? []

  test('hugs its content in the wide layout instead of spanning the column', async () => {
    mockWindowWidth = 1024
    await renderTabBar()

    const island = findTabIsland()

    if (!island) throw new Error(TAB_ISLAND_NOT_FOUND)

    // Three label-only tab slots plus the narrower icon-only search slot, with
    // the inner paddings: a narrow pill, not the 550pt-wide column.
    const naturalWidth =
      ISLAND_CONTENT_PADDING_HORIZONTAL * 2 + 3 * WIDE_TAB_SLOT_WIDTH + WIDE_SEARCH_SLOT_WIDTH
    expect(naturalWidth).toBe(332)
    expect(StyleSheet.flatten(island.props.style)?.width).toBe(naturalWidth)
    expect(naturalWidth).toBeLessThan(CONTENT_COLUMN_WIDTH)
  })

  test('gives wide tabs and the search slot their per-kind widths and centers the island', async () => {
    mockWindowWidth = 1024
    await renderTabBar()

    const widths = findTabSlots().map(slot => StyleSheet.flatten(slot.props.style)?.width)

    expect(widths).toEqual([
      WIDE_TAB_SLOT_WIDTH,
      WIDE_TAB_SLOT_WIDTH,
      WIDE_TAB_SLOT_WIDTH,
      WIDE_SEARCH_SLOT_WIDTH,
    ])

    // The row no longer pads a full-width island: it just centers the hugged pill.
    const rowStyle = StyleSheet.flatten(findIslandsRow()?.props.style)
    expect(rowStyle).toMatchObject({ justifyContent: 'center' })
    expect(rowStyle?.paddingLeft).toBeUndefined()
    expect(rowStyle?.paddingRight).toBeUndefined()
  })

  test('renders the wide tabs as text-only labels without icons', async () => {
    mockWindowWidth = 1024
    const { getByText } = await renderTabBar()

    for (const label of ['Слушать', 'Читать', 'Ещё'])
      expect(getByText(label)).toHaveStyle({ fontSize: WIDE_TAB_LABEL_SIZE })

    const iconsInTabs = findTabSlots()
      .slice(0, 3)
      .flatMap(slot =>
        slot.queryAll(instance => StyleSheet.flatten(instance.props.style)?.fontSize === 28),
      )

    expect(iconsInTabs).toHaveLength(0)
  })

  test('renders the wide search slot as an icon without its label', async () => {
    mockWindowWidth = 1024
    await renderTabBar()

    const searchSlot = findTabSlots()[3]

    expect(
      searchSlot.queryAll(instance => StyleSheet.flatten(instance.props.style)?.fontSize === 28),
    ).toHaveLength(1)
    expect(within(searchSlot).queryByText('Поиск')).toBeNull()
  })

  test('centers the wide search icon vertically instead of lifting it for a label', async () => {
    mockWindowWidth = 1024
    await renderTabBar()

    const searchSlot = findTabSlots()[3]
    const icon = searchSlot.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.fontSize === 28,
    )[0]
    const iconContainer = icon?.parent

    if (!iconContainer) throw new Error('icon container not found')

    // No label below it in wide, so the icon must not keep the compact -8 lift
    // that makes room for the stacked label. The zero is an explicit static
    // transform rather than dropping the animated style: Reanimated writes
    // transforms straight to the web DOM, and a style frozen from the compact
    // first frame (window dimensions land after mount) would otherwise keep the
    // magnifier pressed to the top of the 48dp slot (Issue #152 pattern).
    expect(StyleSheet.flatten(iconContainer.props.style)?.transform).toEqual([{ translateY: 0 }])
    expect(StyleSheet.flatten(iconContainer.parent?.props.style)).toMatchObject({
      justifyContent: 'center',
    })
  })

  const CAPSULE_COLOR = 'rgba(241, 96, 49, 0.18)'

  // A capsule is only a highlight while it is actually painted: the collapsed
  // tab slot still mounts its capsule element at opacity 0.
  const isVisibleCapsuleNode = (instance: TestInstance) => {
    const flat = StyleSheet.flatten(instance.props.style)

    return flat?.backgroundColor === CAPSULE_COLOR && flat?.opacity !== 0
  }

  test('renders the search tab with the shared tab-label style and an equal slot width', async () => {
    const { getByText } = await renderTabBar()
    const widths = findTabSlots().map(slot => StyleSheet.flatten(slot.props.style)?.width)

    expect(widths).toHaveLength(4)
    expect(new Set(widths).size).toBe(1)
    expect(getByText('Поиск')).toHaveStyle({ fontSize: 12, fontWeight: '500' })
  })

  test('moves the active capsule to the search tab while the search route is focused', async () => {
    const { getByText } = await renderWithProviders(
      <CustomTabBar state={createMockState(1)} {...createBarProps()} />,
      { ctx: createCtx() },
    )
    const island = findTabIsland()

    if (!island) throw new Error(TAB_ISLAND_NOT_FOUND)

    expect(getByText('Поиск')).toHaveStyle({ color: '#f16031' })
    expect(getByText('Слушать')).not.toHaveStyle({ color: '#f16031' })
    expect(island.queryAll(isVisibleCapsuleNode)).toHaveLength(1)
  })

  test('splits the collapsed row into an inactive «Слушать» circle and an active search circle', async () => {
    const ctx = createCtx()
    await renderWithProviders(<CustomTabBar state={createMockState(1)} {...createBarProps()} />, {
      ctx,
    })
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const island = findTabIsland()
    const host = findSearchButtonHost()

    if (!island || !host) throw new Error('tab chrome not found')

    // The fallback tab fills the circle but is not the active destination: it
    // keeps the default tint and no capsule.
    expect(within(island).getByText('Слушать')).not.toHaveStyle({ color: '#f16031' })
    expect(island.queryAll(isVisibleCapsuleNode)).toHaveLength(0)
    // Search owns the active capsule on its own detached circle.
    expect(host.queryAll(isVisibleCapsuleNode)).toHaveLength(1)
  })

  test('leaves the search circle plain while a normal tab is active', async () => {
    const ctx = createCtx()
    await renderWithProviders(<CustomTabBar state={createMockState(0)} {...createBarProps()} />, {
      ctx,
    })
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const host = findSearchButtonHost()

    if (!host) throw new Error(SEARCH_BUTTON_NOT_FOUND)

    expect(host.queryAll(isVisibleCapsuleNode)).toHaveLength(0)
  })

  test('sizes the active item from the one-line axis so the icon centers in the search-open circle', async () => {
    // Search-open: the island collapses to a circle (shape axis A = 1) while the
    // visible field keeps the height at 60 (one-line axis D = 0). Sizing the
    // item from A leaves it 40 tall inside the 60 slot, resting above centre.
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    await renderWithProviders(<CustomTabBar state={createMockState(0)} {...createBarProps()} />, {
      ctx,
    })

    expect(screen.getByText('Слушать').parent).toHaveStyle({ height: 52 })
  })

  test('drops the previously active tab highlight once the capsule reaches search', async () => {
    const props = createBarProps()
    const { getByText, rerender } = await renderWithProviders(
      <CustomTabBar state={createMockState(3)} {...props} />,
      { ctx: createCtx() },
    )

    await rerender(<CustomTabBar state={createMockState(1)} {...props} />)

    // The traveling capsule is still parked on «Ещё», so that tab keeps the
    // tint until the capsule leaves it.
    expect(getByText('Ещё')).toHaveStyle({ color: '#f16031' })
    expect(getByText('Поиск')).not.toHaveStyle({ color: '#f16031' })

    // Three 100ms frames land the 220ms travel; the overshoot and the return
    // settle within ten before the settled React state re-reads the capsule.
    await act(async () => {
      advanceMorphFrames(10)
    })

    expect(getByText('Поиск')).toHaveStyle({ color: '#f16031' })
    expect(getByText('Ещё')).not.toHaveStyle({ color: '#f16031' })
    expect(getByText('Слушать')).not.toHaveStyle({ color: '#f16031' })
  })

  test('a deep link straight to search shows the fallback tab without a capsule', async () => {
    const { getByText } = await renderWithProviders(
      <CustomTabBar state={createMockState(1)} {...createBarProps()} />,
      { ctx: createCtx() },
    )

    expect(getByText('Слушать')).toBeTruthy()
    expect(getByText('Слушать')).not.toHaveStyle({ color: '#f16031' })
    expect(getByText('Поиск')).toHaveStyle({ color: '#f16031' })
  })

  test('pressing the fallback tab leaves the search route', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    const { getByText } = await renderWithProviders(
      <CustomTabBar state={createMockState(1)} {...createBarProps()} />,
      { ctx },
    )

    await fireEvent.press(getByText('Слушать'))

    expect(mockNavigate).toHaveBeenCalledWith('listen')
  })
})
