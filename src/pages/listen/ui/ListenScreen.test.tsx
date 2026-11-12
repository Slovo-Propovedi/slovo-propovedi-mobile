import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { type TestInstance } from 'test-renderer'
import { authStatusAtom, authUserAtom, restoreSession } from 'entities/auth'
import { authMocks, sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { ListenScreen } from './ListenScreen'

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
const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])

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

describe('<ListenScreen>', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockedRestoreSession.mockClear()
    mockedRestoreSession.mockResolvedValue(null)
  })

  test('shows sections by default', async () => {
    const { getByText } = await renderWithProviders(<ListenScreen />, {})

    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
  })

  test('exposes the page content as the /listen blur backdrop', async () => {
    const { getByText } = await renderWithProviders(<ListenScreen />, {})

    expect(getByText('BLUR_TARGET:/listen')).toBeTruthy()
  })

  test('renders the large screen title', async () => {
    const { getByRole } = await renderWithProviders(<ListenScreen />, {})

    expect(getByRole('header', { name: 'Слушать' })).toBeTruthy()
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
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'moderator')

    const { getByLabelText } = await renderWithProviders(<ListenScreen />, { ctx })

    expect(getByLabelText(ADMIN_BUTTON_LABEL)).toBeTruthy()
    // The shield is an in-flow sibling of the magnifier inside the scroll
    // content: it shares the top row and scrolls with the sections.
    expect(hasScrollAncestor(getByLabelText(ADMIN_BUTTON_LABEL))).toBe(true)
  })
})
