import { fireEvent, waitFor } from '@testing-library/react-native'
import { playlistsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminPlaylistDetailScreen } from './AdminPlaylistDetailScreen'

const mockFindOne = jest.fn()
const mockRemove = jest.fn()
const mockReorder = jest.fn()
const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({
      playlistControllerFindOne: mockFindOne,
      playlistControllerRemove: mockRemove,
      reorderSermonsInPlaylist: mockReorder,
    }),
  },
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'p1' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))

// DraggableFlatList is a pure-JS reanimated list; a FlatList passthrough keeps
// the row rendering under test without dragging internals.
jest.mock('react-native-draggable-flatlist', () => {
  const { FlatList } = jest.requireActual('react-native')

  return { __esModule: true, default: FlatList }
})

const createPlaylist = () => {
  const playlist = playlistsMocks.getPlaylistControllerFindOneResponseMock({
    description: 'Описание',
    title: 'Плейлист',
  })
  playlist.sermons = [playlist.sermons[0]]

  return playlist
}

describe('<AdminPlaylistDetailScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemove.mockResolvedValue({ status: 'ok' })
  })

  test('renders the playlist hero and its sermons', async () => {
    const playlist = createPlaylist()
    mockFindOne.mockResolvedValue(playlist)

    const { findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)

    expect(await findByText('Плейлист')).toBeTruthy()
    expect(await findByText('Описание')).toBeTruthy()
    expect(await findByText('Проповеди плейлиста (1)')).toBeTruthy()
  })

  test('opens the admin sermon detail when a sermon row is pressed', async () => {
    const playlist = createPlaylist()
    const sermon = playlist.sermons[0]
    mockFindOne.mockResolvedValue(playlist)

    const { findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)
    fireEvent.press(await findByText(sermon.title))

    expect(mockPush).toHaveBeenCalledWith({
      params: { id: sermon.id },
      pathname: '/admin/sermons/[id]',
    })
  })

  test('shows the not-found state when the playlist is missing', async () => {
    mockFindOne.mockRejectedValue(new Error('404'))

    const { findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)

    expect(await findByText('Плейлист не найден')).toBeTruthy()
  })

  test('deletes the playlist and navigates back after confirmation', async () => {
    mockFindOne.mockResolvedValue(createPlaylist())

    const { findByText, getAllByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)
    fireEvent.press(await findByText('Удалить'))

    // The dialog mounts inside RN Modal; its confirm button shares the «Удалить»
    // label with the header action.
    expect(await findByText('Удалить плейлист?')).toBeTruthy()
    const confirmButtons = getAllByText('Удалить', { includeHiddenElements: true })
    fireEvent.press(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('p1'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})
