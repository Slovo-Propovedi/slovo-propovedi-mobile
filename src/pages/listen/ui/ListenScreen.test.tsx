import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, within } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { type TestInstance } from 'test-renderer'
import { authStatusAtom, authUserAtom, restoreSession } from 'entities/auth'
import { authMocks, sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_OUTER_GAP,
  BAR_TOP_ISLAND_MARGIN,
  WIDE_BAR_ROW_HEIGHT,
  WIDE_CONTENT_TOP_GAP,
  WIDE_TAB_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { ListenScreen } from './ListenScreen'

const WIDE_DIMENSIONS = { fontScale: 1, height: 800, width: 1024 }
const COMPACT_DIMENSIONS = { fontScale: 1, height: 390, width: 844 }

let mockBottomInset = 0
let mockLeftInset = 0
let mockRightInset = 0
let mockTopInset = 0

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({
      bottom: mockBottomInset,
      left: mockLeftInset,
      right: mockRightInset,
      top: mockTopInset,
    }),
  }
})

// A tablet-class frame keeps every test in the wide layout; the provider's
// insets are zero, so only the chrome reserve is left in the top band.
const mockUseWindowDimensions = jest.fn(() => WIDE_DIMENSIONS)

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}))

// The floating top island occupies this much of the scroll content in wide,
// plus the extra clearance that keeps the first section header clear of it.
const WIDE_TOP_CHROME_SCROLL_INSET =
  BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP + WIDE_CONTENT_TOP_GAP

const mockPush = jest.fn()

jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')
  const { Text } = jest.requireActual('react-native')

  return {
    ...actual,
    BlurBackdrop: ({ children, routeKey }: { children: ReactNode; routeKey: string }) => (
      <>
        <Text>{`BLUR_TARGET:${routeKey}`}</Text>
        {children}
      </>
    ),
    PullToRefresh: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: jest.fn() }),
  usePathname: () => '/listen',
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('entities/auth', () => ({
  ...jest.requireActual('entities/auth'),
  restoreSession: jest.fn(),
}))

const mockedRestoreSession = restoreSession as jest.MockedFunction<typeof restoreSession>

// Jest hoists mock factories above imports, so the factory may only reference
// `mock`-prefixed bindings. This alias keeps the namespace import intact.
const mockCreateDistinctValuesResponse =
  sermonsMocks.getSermonControllerGetDistinctValuesResponseMock

jest.mock('entities/offline-cache', () => ({
  ...jest.requireActual('entities/offline-cache'),
  useTrackItemCache: jest.fn(() => ({
    isCached: false,
    isCacheDisabled: false,
    isDownloading: false,
    isQueued: false,
    isSermonCachingEnabled: true,
    progressValue: -1,
    toggleCache: jest.fn(),
    visualState: 'cloud',
  })),
}))

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    Entypo: (props: { name: string }) => <Text>{props.name}</Text>,
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
    MaterialCommunityIcons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.fn(),
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: jest.fn(),
      sermonControllerGetDistinctValues: jest
        .fn()
        .mockResolvedValue(mockCreateDistinctValuesResponse()),
    }),
  },
}))

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => []),
  useHistoryProgressMap: jest.fn(() => new Map()),
  useHistorySermonIds: jest.fn(() => new Set()),
}))

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(() => jest.fn()),
}))

const mockFetchAllSections = jest.fn()
const mockLoadMyPlaylists = jest.fn()
const mockLoadSectionSettings = jest.fn()

// Reatom `useAction` accepts a plain function in tests; these wrappers keep the
// real slice exports (atoms, mappers) while letting the refresh test observe calls.
jest.mock('entities/section', () => ({
  ...jest.requireActual('entities/section'),
  fetchAllSections: (...args: unknown[]) => mockFetchAllSections(...args),
}))

jest.mock('entities/playlist', () => ({
  ...jest.requireActual('entities/playlist'),
  loadMyPlaylists: (...args: unknown[]) => mockLoadMyPlaylists(...args),
  loadSectionSettings: (...args: unknown[]) => mockLoadSectionSettings(...args),
}))

jest.mock('./DynamicSectionsSlider', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    DynamicSectionsSlider: () => <Text>SECTIONS_MOCK</Text>,
  }
})

const SECTIONS_MOCK = 'SECTIONS_MOCK'
const MY_PLAYLISTS_TITLE = 'Мои плейлисты'
const ADMIN_BUTTON_LABEL = 'Админка'
const WIDE_TOP_ACTIONS_TEST_ID = 'wide-top-actions'
const TITLE_ROW_TEST_ID = 'screen-title-row'
const HELP_BUTTON_LABEL = 'Онбординг и помощь'
const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])
const BOTTOM_CHROME_SPACE_TEST_ID = 'bottom-chrome-space'
const mockedWithTiming = withTiming as jest.Mock

// A pinned element (the search bar) must not have any scroll container between
// itself and the screen root; a scrolling element (the magnifier) must have one.
const hasScrollAncestor = (element: TestInstance): boolean => {
  let current: null | TestInstance = element.parent

  while (current !== null) {
    if (SCROLL_HOST_TYPES.has(current.type)) return true
    current = current.parent
  }

  return false
}

// The refresh control is a prop of the scroll host (iOS renders it as a child
// too, but the host keeps the original prop), so walk up to the ScrollView.
const findRefreshControl = (element: TestInstance) => {
  let current: null | TestInstance = element

  while (current !== null) {
    if (SCROLL_HOST_TYPES.has(String(current.type))) return current.props.refreshControl
    current = current.parent
  }

  throw new Error('Expected a scroll host ancestor, none found')
}

const setAuthenticatedUser = (ctx: ReturnType<typeof createCtx>, role: 'admin' | 'moderator') => {
  authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role }))
  authStatusAtom(ctx, 'authenticated')
}

// The screen's vertical scroller: the host that owns the content container.
const findContentScrollView = () =>
  screen.root?.queryAll(
    instance =>
      SCROLL_HOST_TYPES.has(String(instance.type)) &&
      instance.props.contentContainerStyle !== undefined,
  )[0]

// The screen always renders exactly one content scroller; tests fail loudly
// instead of asserting against a missing host.
const requireContentScrollView = (): TestInstance => {
  const scrollView = findContentScrollView()

  if (!scrollView) throw new Error('Expected a content scroll view')

  return scrollView
}

// Text of the first content block inside the scroll container. In wide the
// empty title row is gone, so the first section must own the top of the content.
const firstScrollContentText = (): null | string => {
  const [firstText] = findContentScrollView()?.queryAll(node => node.type === 'Text') ?? []
  return firstText ? String(firstText.props.children) : null
}

// Lateral padding on the screen root above the scroller: the safe-area edges
// the screen applies itself instead of a native SafeAreaView.
const lateralPaddingAboveScroller = (scrollView: TestInstance) => {
  let current: null | TestInstance = scrollView

  while (current !== null) {
    const style = StyleSheet.flatten(current.props.style)

    if (style?.paddingLeft !== undefined)
      return { left: style.paddingLeft, right: style.paddingRight }

    current = current.parent
  }

  return null
}

// Total layout padding between the scroll host and the screen root. Any value
// here is an opaque band that clips the list and swallows drags over it.
const topBandHeightAboveScroller = (scrollView: TestInstance): number => {
  let band = 0
  let current: null | TestInstance = scrollView

  while (current !== null) {
    band += StyleSheet.flatten(current.props.style)?.paddingTop ?? 0
    current = current.parent
  }

  return band
}

describe('<ListenScreen>', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockedRestoreSession.mockClear()
    mockedRestoreSession.mockResolvedValue(null)
    mockUseWindowDimensions.mockReturnValue(WIDE_DIMENSIONS)
    mockBottomInset = 0
    mockLeftInset = 0
    mockRightInset = 0
    mockTopInset = 0
    mockedWithTiming.mockClear()
  })

  test('shows sections by default', async () => {
    const { getByText } = await renderWithProviders(<ListenScreen />, {})

    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
  })

  test('exposes the page content as the /listen blur backdrop', async () => {
    const { getByText } = await renderWithProviders(<ListenScreen />, {})

    expect(getByText('BLUR_TARGET:/listen')).toBeTruthy()
  })

  test('drops the title row in the wide layout', async () => {
    const { queryByRole, queryByTestId } = await renderWithProviders(<ListenScreen />, {})

    expect(queryByRole('header', { name: 'Слушать' })).toBeNull()
    // The row is not rendered at all: no empty spacer above the sections.
    expect(queryByTestId(TITLE_ROW_TEST_ID)).toBeNull()
    // The first section opens the scroll content, right below the island inset.
    expect(firstScrollContentText()).toBe(SECTIONS_MOCK)
  })

  test('renders the title row in the compact layout', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)

    const { getByRole, getByTestId } = await renderWithProviders(<ListenScreen />, {})

    expect(getByRole('header', { name: 'Слушать' })).toBeTruthy()
    expect(getByTestId(TITLE_ROW_TEST_ID)).toBeTruthy()
  })

  test('renders the my-playlists section title', async () => {
    const { getByLabelText } = await renderWithProviders(<ListenScreen />, {})

    expect(getByLabelText(MY_PLAYLISTS_TITLE)).toBeTruthy()
  })

  test('reloads sections, playlists and settings when pulled to refresh', async () => {
    const { getByText } = await renderWithProviders(<ListenScreen />, {})
    const refreshControl = findRefreshControl(getByText(SECTIONS_MOCK))

    mockFetchAllSections.mockClear()
    mockLoadMyPlaylists.mockClear()
    mockLoadSectionSettings.mockClear()

    await act(async () => {
      await refreshControl.props.onRefresh()
    })

    expect(mockFetchAllSections).toHaveBeenCalledTimes(1)
    expect(mockLoadMyPlaylists).toHaveBeenCalledTimes(1)
    expect(mockLoadSectionSettings).toHaveBeenCalledTimes(1)
  })

  test('ignores a second pull-to-refresh within the minimum interval', async () => {
    const { getByText } = await renderWithProviders(<ListenScreen />, {})
    const refreshControl = findRefreshControl(getByText(SECTIONS_MOCK))

    mockFetchAllSections.mockClear()

    await act(async () => {
      await refreshControl.props.onRefresh()
    })
    await act(async () => {
      await refreshControl.props.onRefresh()
    })

    expect(mockFetchAllSections).toHaveBeenCalledTimes(1)
  })

  test('offsets the refresh spinner below the floating wide island', async () => {
    const { getByText } = await renderWithProviders(<ListenScreen />, {})
    const refreshControl = findRefreshControl(getByText(SECTIONS_MOCK))

    expect(refreshControl.props.progressViewOffset).toBe(WIDE_TOP_CHROME_SCROLL_INSET)
  })

  test('keeps the compact refresh spinner at the top', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)

    const { getByText } = await renderWithProviders(<ListenScreen />, {})
    const refreshControl = findRefreshControl(getByText(SECTIONS_MOCK))

    expect(refreshControl.props.progressViewOffset).toBe(0)
  })

  test('does not render the admin button when unauthenticated', async () => {
    const ctx = createCtx()
    authStatusAtom(ctx, 'unauthenticated')

    const { queryByLabelText } = await renderWithProviders(<ListenScreen />, { ctx })

    expect(queryByLabelText(ADMIN_BUTTON_LABEL)).toBeNull()
  })

  test('does not render the admin button for a regular user', async () => {
    const ctx = createCtx()
    authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role: 'user' }))
    authStatusAtom(ctx, 'authenticated')

    const { queryByLabelText } = await renderWithProviders(<ListenScreen />, { ctx })

    expect(queryByLabelText(ADMIN_BUTTON_LABEL)).toBeNull()
  })

  test('renders the admin button for an admin user and navigates to /admin', async () => {
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'admin')

    const { getByLabelText } = await renderWithProviders(<ListenScreen />, { ctx })

    await fireEvent.press(getByLabelText(ADMIN_BUTTON_LABEL))
    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  test('renders the admin button for a moderator user', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'moderator')

    const { getByLabelText } = await renderWithProviders(<ListenScreen />, { ctx })

    expect(getByLabelText(ADMIN_BUTTON_LABEL)).toBeTruthy()
    // Compact keeps the shield an in-flow sibling of the magnifier inside the
    // scroll content: it shares the top row and scrolls with the sections.
    expect(hasScrollAncestor(getByLabelText(ADMIN_BUTTON_LABEL))).toBe(true)
  })

  test('floats the header actions in a fixed top-right slot in the wide layout', async () => {
    const { getByLabelText, getByTestId } = await renderWithProviders(<ListenScreen />, {})

    const overlay = getByTestId(WIDE_TOP_ACTIONS_TEST_ID)
    const overlayStyle = StyleSheet.flatten(overlay.props.style)

    // The slot mirrors the floating island's middle (the island is bottom-anchored
    // in the chrome row, so its top is the row's leftover height below the row top).
    expect(overlayStyle.position).toBe('absolute')
    expect(overlayStyle.top).toBe(
      BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT - WIDE_TAB_ISLAND_HEIGHT,
    )
    expect(within(overlay).getByLabelText(HELP_BUTTON_LABEL)).toBeTruthy()
    // Fixed overlay: the actions no longer scroll with the sections.
    expect(hasScrollAncestor(overlay)).toBe(false)
    expect(hasScrollAncestor(getByLabelText(HELP_BUTTON_LABEL))).toBe(false)
  })

  test('keeps the header actions in the title row in the compact layout', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)

    const { getByLabelText, queryByTestId } = await renderWithProviders(<ListenScreen />, {})

    expect(queryByTestId(WIDE_TOP_ACTIONS_TEST_ID)).toBeNull()
    expect(hasScrollAncestor(getByLabelText(HELP_BUTTON_LABEL))).toBe(true)
  })

  test('reserves the wide top island inside the scroll content, not as a band above it', async () => {
    await renderWithProviders(<ListenScreen />, {})
    const scrollView = findContentScrollView()

    expect(scrollView).toBeDefined()
    // The island clearance rides in the content: cards start below the island at
    // rest, but scroll (and take taps) under the glass while the page moves.
    expect(StyleSheet.flatten(scrollView?.props.contentContainerStyle)?.paddingTop).toBe(
      WIDE_TOP_CHROME_SCROLL_INSET,
    )
    // No opaque plate above the scroller: the full-width chrome band would clip
    // the first cards and swallow drags that start over it.
    expect(scrollView && topBandHeightAboveScroller(scrollView)).toBe(0)
  })

  test('snaps the top safe-area padding when the insets arrive in two waves', async () => {
    mockTopInset = 20
    const { rerender } = await renderWithProviders(<ListenScreen />, {})

    expect(topBandHeightAboveScroller(requireContentScrollView())).toBe(20)

    // Rotation on Android restores the bars after the first inset commit.
    mockTopInset = 0
    mockedWithTiming.mockClear()
    await act(async () => {
      await rerender(<ListenScreen />)
    })

    expect(mockedWithTiming).not.toHaveBeenCalled()
    // The mock re-evaluates the animated style at render time: the direct
    // assignment is already in the shared value, the next commit paints it.
    await act(async () => {
      await rerender(<ListenScreen />)
    })
    expect(topBandHeightAboveScroller(requireContentScrollView())).toBe(0)
  })

  test('snaps the lateral insets so the cutout reflow stays sharp', async () => {
    const { rerender } = await renderWithProviders(<ListenScreen />, {})

    expect(lateralPaddingAboveScroller(requireContentScrollView())).toEqual({ left: 0, right: 0 })

    // The camera cutout lands on the left after a rotation.
    mockLeftInset = 44
    mockedWithTiming.mockClear()
    await act(async () => {
      await rerender(<ListenScreen />)
    })

    expect(mockedWithTiming).not.toHaveBeenCalled()
    await act(async () => {
      await rerender(<ListenScreen />)
    })
    expect(lateralPaddingAboveScroller(requireContentScrollView())).toEqual({ left: 44, right: 0 })
  })

  test('reserves the bottom chrome with a snapping spacer, not static padding', async () => {
    const { getByTestId, rerender } = await renderWithProviders(<ListenScreen />, {})
    const scrollView = findContentScrollView()

    expect(StyleSheet.flatten(getByTestId(BOTTOM_CHROME_SPACE_TEST_ID).props.style)?.height).toBe(
      PLAYER_SIZES.wideMiniPlayerHeight + BAR_BOTTOM_INSET_MIN + BAR_OUTER_GAP,
    )
    // The reserve lives in the spacer, so the padding no longer jumps on its own.
    expect(
      StyleSheet.flatten(scrollView?.props.contentContainerStyle)?.paddingBottom,
    ).toBeUndefined()

    mockBottomInset = 20
    mockedWithTiming.mockClear()
    await act(async () => {
      await rerender(<ListenScreen />)
    })

    expect(mockedWithTiming).not.toHaveBeenCalled()
    await act(async () => {
      await rerender(<ListenScreen />)
    })
    expect(StyleSheet.flatten(getByTestId(BOTTOM_CHROME_SPACE_TEST_ID).props.style)?.height).toBe(
      PLAYER_SIZES.wideMiniPlayerHeight + mockBottomInset + BAR_OUTER_GAP,
    )
  })
})
