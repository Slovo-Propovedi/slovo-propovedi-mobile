import { createCtx } from '@reatom/framework'
import { fireEvent, screen } from '@testing-library/react-native'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks'
import {
  isSearchingAtom,
  searchPlaylistsAtom,
  searchPreachersAtom,
  searchQueryAtom,
  searchResultsAtom,
} from '../model'
import { SearchGroupedResults } from './SearchGroupedResults'

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

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({ playlistControllerFindAll: jest.fn() }),
  },
  sermonsApi: {
    getSermons: () => ({ sermonControllerFindAll: jest.fn() }),
  },
}))

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(() => jest.fn()),
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
  return { TracksListItem }
})

jest.mock('../lib/useDebouncedSearch', () => ({
  useDebouncedSearch: () => undefined,
}))

const ACTIVE_QUERY = 'вера'
const SHORT_QUERY = 'в'
const NO_RESULTS_MESSAGE = 'Ничего не найдено'
const SERMONS_LABEL = 'Проповеди'
const PLAYLISTS_LABEL = 'Плейлисты'
const PREACHERS_LABEL = 'Проповедники'

const buildSermon = (index: number): SermonData => ({
  artist: `Проповедник ${index}`,
  artwork: null,
  audioUrl: `https://example.com/${index}.mp3`,
  id: `sermon-${index}`,
  title: `Проповедь ${index}`,
})

const buildPlaylist = (index: number): PlaylistData => ({
  artwork: null,
  description: `Описание ${index}`,
  id: `playlist-${index}`,
  sermons: [],
  title: `Плейлист ${index}`,
})

const renderWithState = async ({
  isSearching = false,
  onPlaylistPress = jest.fn(),
  playlists = [],
  preachers = [],
  query = ACTIVE_QUERY,
  sermons = [],
}: {
  isSearching?: boolean
  onPlaylistPress?: (playlist: PlaylistData) => void
  playlists?: PlaylistData[]
  preachers?: string[]
  query?: string
  sermons?: SermonData[]
} = {}) => {
  const ctx = createCtx()
  searchQueryAtom(ctx, query)
  searchResultsAtom(ctx, sermons)
  searchPlaylistsAtom(ctx, playlists)
  searchPreachersAtom(ctx, preachers)
  isSearchingAtom(ctx, isSearching)

  return renderWithProviders(<SearchGroupedResults onPlaylistPress={onPlaylistPress} />, { ctx })
}

describe('<SearchGroupedResults>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders a header with count for every non-empty group', async () => {
    await renderWithState({
      playlists: [buildPlaylist(1), buildPlaylist(2)],
      preachers: ['Иван', 'Пётр', 'Павел'],
      sermons: [buildSermon(1)],
    })

    expect(screen.getByRole('button', { name: `${SERMONS_LABEL}, 1` })).toBeTruthy()
    expect(screen.getByRole('button', { name: `${PLAYLISTS_LABEL}, 2` })).toBeTruthy()
    expect(screen.getByRole('button', { name: `${PREACHERS_LABEL}, 3` })).toBeTruthy()
  })

  test('caps the sermons group at four rows', async () => {
    await renderWithState({
      sermons: [1, 2, 3, 4, 5, 6].map(buildSermon),
    })

    expect(screen.getByText('Проповедь 4')).toBeTruthy()
    expect(screen.queryByText('Проповедь 5')).toBeNull()
    expect(screen.queryByText('Проповедь 6')).toBeNull()
  })

  test('shows the empty state only when all groups are empty', async () => {
    await renderWithState({ playlists: [buildPlaylist(1)] })

    expect(screen.queryByText(NO_RESULTS_MESSAGE)).toBeNull()
    expect(screen.getByText('Плейлист 1')).toBeTruthy()
  })

  test('shows the empty state when every group is empty', async () => {
    await renderWithState()

    expect(screen.getByText(NO_RESULTS_MESSAGE)).toBeTruthy()
  })

  test('fires onShowAllGroup with the group key and query on header press', async () => {
    const ctx = createCtx()
    const onShowAllGroup = jest.fn()
    searchQueryAtom(ctx, ACTIVE_QUERY)
    searchResultsAtom(ctx, [buildSermon(1)])
    await renderWithProviders(
      <SearchGroupedResults onPlaylistPress={jest.fn()} onShowAllGroup={onShowAllGroup} />,
      { ctx },
    )

    await fireEvent.press(screen.getByRole('button', { name: `${SERMONS_LABEL}, 1` }))

    expect(onShowAllGroup).toHaveBeenCalledWith('sermons', ACTIVE_QUERY)
  })

  test('forwards playlist press to the onPlaylistPress callback', async () => {
    const onPlaylistPress = jest.fn()
    await renderWithState({ onPlaylistPress, playlists: [buildPlaylist(1)] })

    await fireEvent.press(screen.getByText('Плейлист 1'))

    expect(onPlaylistPress).toHaveBeenCalledWith(expect.objectContaining({ id: 'playlist-1' }))
  })

  test('fires onPreacherPress with the artist on preacher press', async () => {
    const ctx = createCtx()
    const onPreacherPress = jest.fn()
    searchQueryAtom(ctx, ACTIVE_QUERY)
    searchPreachersAtom(ctx, ['Иван'])
    await renderWithProviders(
      <SearchGroupedResults onPlaylistPress={jest.fn()} onPreacherPress={onPreacherPress} />,
      { ctx },
    )

    await fireEvent.press(screen.getByText('Иван'))

    expect(onPreacherPress).toHaveBeenCalledWith('Иван')
  })

  test('renders nothing when the query is below the minimum length', async () => {
    await renderWithState({ query: SHORT_QUERY, sermons: [buildSermon(1)] })

    expect(screen.queryByText('Проповедь 1')).toBeNull()
    expect(screen.queryByText(NO_RESULTS_MESSAGE)).toBeNull()
  })

  test('renders the grouped skeleton while searching', async () => {
    await renderWithState({ isSearching: true })

    expect(screen.getAllByTestId('tracks-list-item-skeleton').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('search-row-skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByText(NO_RESULTS_MESSAGE)).toBeNull()
  })
})
