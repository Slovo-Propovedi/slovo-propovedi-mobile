import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import {
  searchCloseMorphDriver,
  searchFocusMorphDriver,
  searchOpenMorphDriver,
} from 'widgets/search-island/@x/morphDrivers'
import { tabIslandMorphDriver } from 'widgets/tab-bar/@x/morph'
import { isSearchOpenAtom } from 'features/sermon-search'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { showInfo } from 'shared/model/info-dialog'
import { getGlassBorder, getGlassFill, GLASS } from 'shared/ui'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_CIRCLE_SIZE_EXPANDED,
  BAR_ROW_MIN_HEIGHT,
  isBarCollapsedAtom,
  isTabBarMeasuredAtom,
  keyboardBottomInsetSv,
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  tabBarHeightAtom,
} from 'shared/ui/layout'
import { RADIUSES, themeModeAtom } from 'shared/ui/theme'
import { CustomTabBar } from './CustomTabBar'
import { styles } from './styles'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE } from './useTabPress'

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurView: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
}))

const mockShadeProps: Array<{ hasMiniPlayer?: boolean; hasSearch?: boolean }> = []

jest.mock('widgets/expandable-player/@x/barShade', () => {
  const { View } = jest.requireActual('react-native')

  return {
    BarBackdropShade: (props: { hasMiniPlayer?: boolean; hasSearch?: boolean }) => {
      mockShadeProps.push(props)

      return <View style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
    },
  }
})

let mockBottomInset = 0

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({ bottom: mockBottomInset, left: 0, right: 0, top: 0 }),
  }
})

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))
const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>

const mockOpenSearch = jest.fn()
const mockCloseSearch = jest.fn()
const mockCloseSearchAndExpand = jest.fn()
let mockIsSearchFieldVisible = false

jest.mock('features/sermon-search', () => {
  const { action, atom } = jest.requireActual('@reatom/framework')
  return {
    closeSearch: action(() => mockCloseSearch(), 'mockCloseSearch'),
    closeSearchAndExpand: action(() => mockCloseSearchAndExpand(), 'mockCloseSearchAndExpand'),
    isSearchOpenAtom: atom(false, 'mockIsSearchOpenAtom'),
    SearchBar: () => null,
    useIsSearchFieldVisible: () => mockIsSearchFieldVisible,
    useOpenSearch: () => mockOpenSearch,
  }
})

const mockNavigate = jest.fn()

const createMockState = (activeIndex: number) => ({
  history: [{ key: 'listen', type: 'route' as const }],
  index: activeIndex,
  key: 'tab-root',
  preloadedRouteKeys: [] as string[],
  routeNames: ['listen', 'read', 'more'],
  routes: [
    { key: 'listen', name: 'listen', path: '/listen' },
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
  {
    hasMiniPlayer,
    hideSearch,
    isCollapsed = false,
  }: { hasMiniPlayer?: boolean; hideSearch?: boolean; isCollapsed?: boolean } = {},
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
      hasMiniPlayer={hasMiniPlayer}
      insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
    />,
    { ctx },
  )
}

describe('<CustomTabBar>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBottomInset = 0
    mockIsSearchFieldVisible = false
    mockShadeProps.length = 0
    tabIslandMorphDriver.reset()
    searchOpenMorphDriver.reset()
    searchFocusMorphDriver.reset()
    searchCloseMorphDriver.reset()
  })

  const findIslandsRow = () =>
    screen.root?.queryAll(
      instance =>
        typeof instance.props.onLayout === 'function' &&
        StyleSheet.flatten(instance.props.style)?.height ===
          BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN,
    )[0]

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

  test('renders the backdrop shade as the floating container first child', async () => {
    await renderTabBar()

    const container = findFloatingContainer()
    const firstChild = container?.children[0]

    if (!firstChild || typeof firstChild === 'string') throw new Error('first child not found')

    // The mock renders a host View wrapped in a composite: when the composite
    // carries no style, the rendered host sits below it.
    const shadeNode = StyleSheet.flatten(firstChild.props.style)
      ? firstChild
      : firstChild.children[0]

    if (!shadeNode || typeof shadeNode === 'string') throw new Error('shade node not found')

    // The shade must be the first child: the tab-bar layer sits above the
    // opaque screens, and document order keeps the islands above the shade.
    expect(StyleSheet.flatten(shadeNode.props.style)).toMatchObject({
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    })
    expect(container?.children[1]).toBeTruthy()
  })

  test('passes the mini-player mount flag to the shade', async () => {
    await renderTabBar()

    // Only the user zone mounts the mini-player pill; the admin zone must tell
    // the shade to anchor to the islands row instead.
    expect(mockShadeProps.at(-1)).toEqual({ hasMiniPlayer: false, hasSearch: true })

    mockShadeProps.length = 0
    await renderTabBar(0, { hasMiniPlayer: true })

    expect(mockShadeProps.at(-1)).toEqual({ hasMiniPlayer: true, hasSearch: true })

    mockShadeProps.length = 0
    await renderTabBar(0, { hideSearch: true })

    // The admin row has no search chrome, so the shade spans its inner width.
    expect(mockShadeProps.at(-1)).toEqual({ hasMiniPlayer: false, hasSearch: false })
  })

  test('ignores a zero-height layout report', async () => {
    const { ctx } = await renderTabBar()

    await fireLayout(0, 0)

    expect(ctx.get(isTabBarMeasuredAtom)).toBe(false)
  })

  test('publishes a positive measured height', async () => {
    const { ctx } = await renderTabBar()

    await fireLayout(140, 320)

    expect(ctx.get(isTabBarMeasuredAtom)).toBe(true)
    expect(ctx.get(tabBarHeightAtom)).toBe(140)
  })

  test('caps the floating island to the 600px content column', async () => {
    await renderTabBar()

    // Literal 600 (not the constant) guards against regressing to the web-only cap,
    // which is `undefined` under the native jest environment.
    expect(styles.floatingIsland.maxWidth).toBe(600)
  })

  test('insets the islands row so its content shares the mini-pill extent', async () => {
    await renderTabBar()

    // The expanded mini pill is sized to this exact content box (column minus the
    // side insets) so the tab island and search circle edges line up with it.
    // Literal 16 (not the constant) guards the generous side margins.
    expect(styles.islandsRow).toMatchObject({
      maxWidth: 600,
      paddingHorizontal: 16,
    })
  })

  test('floors the bottom inset at 12 so the islands sit low without a system inset', async () => {
    await renderTabBar()

    // Literal 12 (not the constant) guards the small bottom gap.
    expect(findIslandsRowAtHeight(BAR_ROW_MIN_HEIGHT + 12)).toBeDefined()
  })

  test('keeps the 3-button navigation inset above the bottom floor', async () => {
    mockBottomInset = 48
    await renderTabBar()

    expect(findIslandsRowAtHeight(BAR_ROW_MIN_HEIGHT + 48)).toBeDefined()
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
    // device: the expanded island stays pinned to the collapsed 64 and renders
    // visibly shorter than the 76 search circle next to it.
    expect(styles.floatingIsland).not.toHaveProperty('height')
  })

  test('frosts the tab island, the search morph and its hidden close circle', async () => {
    await renderTabBar()

    const blurs = findGlassBlurs()

    // Island + morph container + the always-mounted public ✕ slot.
    expect(blurs).toHaveLength(3)
    expect(blurs.every(blur => blur.props.tint === 'light')).toBe(true)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(true),
    })
    expect(findHairlineBorders(getGlassBorder(true))).toHaveLength(3)
  })

  test('renders the glass island without its own shadow', async () => {
    await renderTabBar()

    const island = screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.borderRadius === RADIUSES.round && flat?.maxWidth === 600
    })[0]

    // The shared `BarBackdropShade` gradient sits behind the bar; the island
    // host itself must stay shadowless.
    expect(StyleSheet.flatten(island?.props.style)).not.toHaveProperty('boxShadow')
  })

  test('uses the dark glass recipe in the dark theme', async () => {
    const { ctx } = await renderTabBar()
    await act(async () => {
      themeModeAtom(ctx, 'dark')
    })

    const blurs = findGlassBlurs()

    expect(blurs).toHaveLength(3)
    expect(blurs.every(blur => blur.props.tint === 'dark')).toBe(true)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(false),
    })
    expect(findHairlineBorders(getGlassBorder(false))).toHaveLength(3)
  })

  const findIslandContent = () =>
    screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return flat?.flexDirection === 'row' && flat?.height === '100%'
    })[0]

  test('insets the island content so the tabs clear the rounded edges', async () => {
    await renderTabBar()

    expect(StyleSheet.flatten(findIslandContent()?.props.style)).toMatchObject({
      paddingLeft: 12,
      paddingRight: 12,
    })
  })

  test('collapsed circle drops the content padding so the active slot fills it', async () => {
    // A `paddingHorizontal` animated style never reaches the web DOM: Reanimated
    // updates styles through createReactDOMStyle, skipping the react-native-web
    // preprocess step that expands shortforms. The 12dp inset then freezes and
    // pushes the 64dp active slot past the circle's right edge.
    await renderTabBar(0, { isCollapsed: true })

    expect(StyleSheet.flatten(findIslandContent()?.props.style)).toMatchObject({
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

  test('renders a slot for every route in the navigator state', async () => {
    const routeNames = ['listen', 'read', 'more', 'history', 'share']
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

    // The bar no longer filters any route: each navigator route gets a slot.
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

  test('renders the circular search button to the right of the island', async () => {
    const { getByRole } = await renderTabBar()

    expect(getByRole('button', { name: 'Поиск' })).toBeTruthy()
  })

  test('hides the search button on the admin tab layout', async () => {
    const { queryByRole } = await renderTabBar(0, { hideSearch: true })

    expect(queryByRole('button', { name: 'Поиск' })).toBeNull()
  })

  test('keeps the search morph mounted while the search field is visible', async () => {
    mockIsSearchFieldVisible = true
    await renderTabBar()

    // The circle is the same always-mounted morph container, not a handoff
    // button: it leaves the accessibility tree but is never unmounted.
    expect(
      screen.root?.queryAll(instance => instance.props.accessibilityLabel === 'Поиск'),
    ).toHaveLength(1)
  })

  test('does not paint its own search-morph shadow', async () => {
    mockIsSearchFieldVisible = true
    await renderTabBar()

    expect(StyleSheet.flatten(findSearchCircle()?.props.style)?.boxShadow).toBeUndefined()
  })

  test('hides the search button from assistive tech while the search field is visible', async () => {
    mockIsSearchFieldVisible = true
    const { queryByRole } = await renderTabBar()

    expect(queryByRole('button', { name: 'Поиск' })).toBeNull()
  })

  test('shows the search button again when a collapsed bar hides the field', async () => {
    mockIsSearchFieldVisible = false
    const { getByRole } = await renderTabBar(0, { isCollapsed: true })

    expect(getByRole('button', { name: 'Поиск' })).toBeTruthy()
  })

  test('pressing the search button opens search', async () => {
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

  test('closes the search from the active circle while the visible field forced the collapsed shape', async () => {
    mockIsSearchFieldVisible = true
    const { ctx, getByText } = await renderTabBar(0)
    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    await fireEvent.press(getByText('Слушать'))

    expect(mockCloseSearchAndExpand).toHaveBeenCalledTimes(1)
    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('does not show info dialog when tapping an active allowed tab', async () => {
    const { getByText } = await renderTabBar(2)

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
})
