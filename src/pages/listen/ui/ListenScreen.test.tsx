import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { StyleSheet, TextInput } from 'react-native'
import { type TestInstance } from 'test-renderer'
import {
  isSearchingAtom,
  isSearchOpenAtom,
  searchQueryAtom,
  searchResultsAtom,
} from 'features/sermon-search/model'
import { authStatusAtom, authUserAtom, restoreSession } from 'entities/auth'
import { type SermonData } from 'entities/sermon'
import { authMocks, sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { TAB_BAR_ISLAND_HEIGHT } from 'shared/ui/layout'
import { ListenScreen } from './ListenScreen'

const mockPush = jest.fn()

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

jest.mock('features/sermon-search/lib/useDebouncedSearch', () => ({
  useDebouncedSearch: () => undefined,
}))

jest.mock('./DynamicSectionsSlider', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    DynamicSectionsSlider: () => <Text>SECTIONS_MOCK</Text>,
  }
})

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const CLEAR_LABEL = 'Очистить'
const CLOSE_SEARCH_LABEL = 'Закрыть поиск'
const SERMON_TITLE = 'Проповедь о вере'
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

const findAncestorWithHeight = (element: TestInstance, height: number): TestInstance => {
  let current: null | TestInstance = element

  while (current !== null) {
    if (StyleSheet.flatten(current.props.style)?.height === height) return current
    current = current.parent
  }

  throw new Error(`Expected an ancestor with height ${height}, none found`)
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

const flushAnimationFrame = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

const sermons: SermonData[] = [
  {
    artist: 'Иван',
    artwork: 'https://example.com/a.jpg',
    audioUrl: 'https://example.com/a.mp3',
    id: '1',
    title: SERMON_TITLE,
  },
]

const renderWithOpenSearch = async (query = '') => {
  const ctx = createCtx()
  isSearchOpenAtom(ctx, true)
  searchQueryAtom(ctx, query)

  return renderWithProviders(<ListenScreen />, { ctx })
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

  test('shows sections by default, without the search field', async () => {
    const { getByText, queryByPlaceholderText } = await renderWithProviders(<ListenScreen />, {})

    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
    expect(queryByPlaceholderText(SEARCH_PLACEHOLDER)).toBeNull()
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

  test('shows the search field island outside the scroll content while search is open', async () => {
    const { ctx, getByPlaceholderText, getByText } = await renderWithOpenSearch()

    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    const field = getByPlaceholderText(SEARCH_PLACEHOLDER)
    expect(hasScrollAncestor(field)).toBe(false)
    expect(findAncestorWithHeight(field, TAB_BAR_ISLAND_HEIGHT)).toBeTruthy()
    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
  })

  test('hides sections and shows search results while the query is active, with the field still in the island', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)
    const { getAllByText, getByPlaceholderText, queryByText } = await renderWithProviders(
      <ListenScreen />,
      { ctx },
    )

    const field = getByPlaceholderText(SEARCH_PLACEHOLDER)
    expect(hasScrollAncestor(field)).toBe(false)
    expect(findAncestorWithHeight(field, TAB_BAR_ISLAND_HEIGHT)).toBeTruthy()
    expect(queryByText(SECTIONS_MOCK)).toBeNull()
    expect(getAllByText(SERMON_TITLE)[0]).toBeTruthy()
  })

  test('clears the query via the inline ⊗ chip and returns sections while the search stays open', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    const { getByLabelText, getByPlaceholderText, getByText, queryByText } =
      await renderWithProviders(<ListenScreen />, { ctx })

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'вера')
    expect(queryByText(SECTIONS_MOCK)).toBeNull()

    await fireEvent.press(getByLabelText(CLEAR_LABEL))

    await waitFor(() => expect(ctx.get(searchQueryAtom)).toBe(''))
    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    const bar = getByPlaceholderText(SEARCH_PLACEHOLDER)
    expect(hasScrollAncestor(bar)).toBe(false)
    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
    expect(queryByText(SERMON_TITLE)).toBeNull()
  })

  test('closes the search via the external ✕ when the field is empty and hides the island', async () => {
    const { ctx, getByLabelText, getByPlaceholderText, queryByPlaceholderText } =
      await renderWithOpenSearch()

    await act(async () => {
      fireEvent(getByPlaceholderText(SEARCH_PLACEHOLDER), 'focus')
    })
    await fireEvent.press(getByLabelText(CLOSE_SEARCH_LABEL))

    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
    expect(queryByPlaceholderText(SEARCH_PLACEHOLDER)).toBeNull()
  })

  test('keeps the search bar mounted across the sections ↔ results transition', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    const focusMock = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus
    focusMock.mockClear()

    const { getByPlaceholderText } = await renderWithProviders(<ListenScreen />, { ctx })
    await flushAnimationFrame()

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'ве')
    await flushAnimationFrame()
    expect(getByPlaceholderText(SEARCH_PLACEHOLDER).props.value).toBe('ве')

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'в')
    await flushAnimationFrame()
    expect(getByPlaceholderText(SEARCH_PLACEHOLDER).props.value).toBe('в')

    // A remount would re-run the rAF autofocus; one call proves the bar stayed put.
    expect(focusMock).toHaveBeenCalledTimes(1)
  })

  test('keeps sections mode for a single-character query below MIN_QUERY_LENGTH', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'в')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)

    const { getByPlaceholderText, getByText, queryByText } = await renderWithProviders(
      <ListenScreen />,
      { ctx },
    )

    expect(hasScrollAncestor(getByPlaceholderText(SEARCH_PLACEHOLDER))).toBe(false)
    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
    expect(queryByText(SERMON_TITLE)).toBeNull()
  })

  test('switches to results mode exactly at MIN_QUERY_LENGTH', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)

    const { getAllByText, getByPlaceholderText, queryByText } = await renderWithProviders(
      <ListenScreen />,
      { ctx },
    )

    expect(hasScrollAncestor(getByPlaceholderText(SEARCH_PLACEHOLDER))).toBe(false)
    expect(getAllByText(SERMON_TITLE)[0]).toBeTruthy()
    expect(queryByText(SECTIONS_MOCK)).toBeNull()
  })

  test('treats a whitespace-only query as inactive', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, '  ')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)

    const { getByPlaceholderText, getByText, queryByText } = await renderWithProviders(
      <ListenScreen />,
      { ctx },
    )

    expect(hasScrollAncestor(getByPlaceholderText(SEARCH_PLACEHOLDER))).toBe(false)
    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
    expect(queryByText(SERMON_TITLE)).toBeNull()
  })

  test('returns sections when the query is edited below the threshold', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)

    const { getAllByText, getByPlaceholderText, getByText, queryByText } =
      await renderWithProviders(<ListenScreen />, { ctx })

    expect(getAllByText(SERMON_TITLE)[0]).toBeTruthy()

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'в')

    expect(getByText(SECTIONS_MOCK)).toBeTruthy()
    expect(queryByText(SERMON_TITLE)).toBeNull()
    expect(hasScrollAncestor(getByPlaceholderText(SEARCH_PLACEHOLDER))).toBe(false)
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

  test('hides the admin button while search is open and active', async () => {
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'admin')
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)

    const { queryByLabelText } = await renderWithProviders(<ListenScreen />, { ctx })

    expect(queryByLabelText(ADMIN_BUTTON_LABEL)).toBeNull()
  })

  test('hides the admin button while search is open but not active', async () => {
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'admin')
    isSearchOpenAtom(ctx, true)

    const { queryByLabelText } = await renderWithProviders(<ListenScreen />, { ctx })

    expect(queryByLabelText(ADMIN_BUTTON_LABEL)).toBeNull()
  })
})
