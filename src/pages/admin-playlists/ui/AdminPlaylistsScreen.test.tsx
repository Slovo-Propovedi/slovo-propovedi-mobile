import { fireEvent, waitFor } from '@testing-library/react-native'
import { playlistsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminPlaylistsScreen } from './AdminPlaylistsScreen'

const mockFindAll = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({ playlistControllerFindAll: mockFindAll }),
  },
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('<AdminPlaylistsScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders playlists with sermon and section counters', async () => {
    const playlist = playlistsMocks.getPlaylistControllerFindAllResponseMock({
      playlists: [
        {
          artwork: 'cover',
          description: 'Описание',
          id: 'p1',
          sections: [],
          sermons: [],
          title: 'Первый',
        },
      ],
    })
    mockFindAll.mockResolvedValue(playlist)

    const { findByText } = await renderWithProviders(<AdminPlaylistsScreen />)

    expect(await findByText('Первый')).toBeTruthy()
    expect(await findByText('0 проповедей · 0 разделов')).toBeTruthy()
  })

  test('navigates to the detail screen on row press', async () => {
    mockFindAll.mockResolvedValue(
      playlistsMocks.getPlaylistControllerFindAllResponseMock({
        playlists: [
          {
            artwork: 'cover',
            description: 'Описание',
            id: 'p1',
            sections: [],
            sermons: [],
            title: 'Первый',
          },
        ],
      }),
    )

    const { findByText } = await renderWithProviders(<AdminPlaylistsScreen />)

    fireEvent.press(await findByText('Первый'))

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        params: { id: 'p1' },
        pathname: '/admin/playlists/[id]',
      }),
    )
  })

  test('navigates to the create screen from the header button', async () => {
    mockFindAll.mockResolvedValue(playlistsMocks.getPlaylistControllerFindAllResponseMock())

    const { findByText } = await renderWithProviders(<AdminPlaylistsScreen />)

    fireEvent.press(await findByText('Создать плейлист'))

    expect(mockPush).toHaveBeenCalledWith('/admin/playlists/create')
  })

  test('shows the empty state when there are no playlists', async () => {
    mockFindAll.mockResolvedValue({ count: 0, playlists: [] })

    const { findByText } = await renderWithProviders(<AdminPlaylistsScreen />)

    expect(await findByText('Плейлистов пока нет')).toBeTruthy()
  })
})
