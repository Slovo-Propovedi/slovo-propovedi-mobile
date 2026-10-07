import { fireEvent, screen } from '@testing-library/react-native'
import { playlistsMocks, sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { SearchResultsScreen } from './SearchResultsScreen'

const mockSermonControllerFindAll = jest.fn()
const mockPlaylistControllerFindAll = jest.fn()
const mockUseLocalSearchParams = jest.fn()
const mockPush = jest.fn()
const mockPlayNewSermon = jest.fn()

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('shared/routing/useHeaderTitle', () => ({
  useHeaderTitle: () => jest.fn(),
}))

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({ playlistControllerFindAll: mockPlaylistControllerFindAll }),
  },
  sermonsApi: {
    getSermons: () => ({ sermonControllerFindAll: mockSermonControllerFindAll }),
  },
}))

jest.mock('entities/player', () => ({
  usePlayNewSermon: () => mockPlayNewSermon,
}))

jest.mock('entities/offline-cache', () => ({
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

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => []),
  useHistoryProgressMap: jest.fn(() => new Map()),
  useHistorySermonIds: jest.fn(() => new Set()),
}))

jest.mock('entities/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')
  const TracksListItem = (props: { subtitle?: string; title: string }) => (
    <View>
      <Text>{props.title}</Text>
      {props.subtitle && <Text>{props.subtitle}</Text>}
    </View>
  )
  TracksListItem.Skeleton = () => <View testID='tracks-list-item-skeleton' />
  return {
    TRACK_LIST_ITEM_SIZES: jest.requireActual('entities/track-list').TRACK_LIST_ITEM_SIZES,
    TracksListItem,
  }
})

const QUERY = 'вера'

const buildSermonsResponse = (
  sermons: ReturnType<typeof sermonsMocks.getSermonControllerFindOneResponseMock>[],
) => sermonsMocks.getSermonControllerFindAllResponseMock({ sermons })

const buildPlaylistsResponse = (
  playlists: ReturnType<typeof playlistsMocks.getPlaylistControllerCreateResponseMock>[],
) => playlistsMocks.getPlaylistControllerFindAllResponseMock({ playlists })

const renderWithParams = async (params: { query?: string; type?: string }) => {
  mockUseLocalSearchParams.mockReturnValue(params)
  return renderWithProviders(<SearchResultsScreen />)
}

describe('<SearchResultsScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSermonControllerFindAll.mockResolvedValue(buildSermonsResponse([]))
    mockPlaylistControllerFindAll.mockResolvedValue(buildPlaylistsResponse([]))
  })

  test('renders the sermon list for the sermons type', async () => {
    const sermon = sermonsMocks.getSermonControllerFindOneResponseMock()
    mockSermonControllerFindAll.mockResolvedValue(buildSermonsResponse([sermon]))

    await renderWithParams({ query: QUERY, type: 'sermons' })

    expect(await screen.findByText(sermon.title)).toBeTruthy()
    expect(mockSermonControllerFindAll).toHaveBeenCalledWith({ search: QUERY, take: 100 })
  })

  test('plays a sermon on tap', async () => {
    const sermon = sermonsMocks.getSermonControllerFindOneResponseMock()
    mockSermonControllerFindAll.mockResolvedValue(buildSermonsResponse([sermon]))
    await renderWithParams({ query: QUERY, type: 'sermons' })

    await fireEvent.press(await screen.findByText(sermon.title))

    expect(mockPlayNewSermon).toHaveBeenCalledWith(
      expect.objectContaining({ sermon: expect.objectContaining({ id: sermon.id }) }),
    )
  })

  test('navigates to the playlist screen on playlist tap', async () => {
    const playlist = playlistsMocks.getPlaylistControllerCreateResponseMock()
    mockPlaylistControllerFindAll.mockResolvedValue(buildPlaylistsResponse([playlist]))
    await renderWithParams({ query: QUERY, type: 'playlists' })

    await fireEvent.press(await screen.findByText(playlist.title))

    expect(mockPush).toHaveBeenCalledWith({
      params: { playlist: playlist.id },
      pathname: '/listen/playlist',
    })
  })

  test('includes a playlist matched only by sermon content on the playlists screen', async () => {
    const contentPlaylist = playlistsMocks.getPlaylistControllerCreateResponseMock({
      id: 'content-playlist',
    })
    const sermon = sermonsMocks.getSermonControllerFindOneResponseMock({
      playlists: [contentPlaylist],
    })
    mockSermonControllerFindAll.mockResolvedValue(buildSermonsResponse([sermon]))
    mockPlaylistControllerFindAll.mockResolvedValue(buildPlaylistsResponse([]))

    await renderWithParams({ query: QUERY, type: 'playlists' })

    expect(await screen.findByText(contentPlaylist.title)).toBeTruthy()
    expect(mockSermonControllerFindAll).toHaveBeenCalledWith({ search: QUERY, take: 100 })
  })

  test('navigates to sermons of a preacher on preacher tap', async () => {
    const sermon = sermonsMocks.getSermonControllerFindOneResponseMock()
    mockSermonControllerFindAll.mockResolvedValue(buildSermonsResponse([sermon]))
    await renderWithParams({ query: sermon.artist, type: 'preachers' })

    await fireEvent.press(await screen.findByText(sermon.artist))

    expect(mockPush).toHaveBeenCalledWith({
      params: { query: sermon.artist, type: 'sermons' },
      pathname: '/listen/search-results',
    })
  })

  test('renders the group skeleton while the full list loads', async () => {
    mockSermonControllerFindAll.mockReturnValue(new Promise(() => undefined))

    await renderWithParams({ query: QUERY, type: 'sermons' })

    expect(screen.getAllByTestId('tracks-list-item-skeleton').length).toBeGreaterThan(0)
  })

  test('renders nothing for invalid params', async () => {
    await renderWithParams({ query: QUERY, type: 'unknown' })

    expect(screen.queryByTestId('tracks-list-item-skeleton')).toBeNull()
    expect(screen.queryByText('Ничего не найдено')).toBeNull()
  })
})
