import { fireEvent, waitFor } from '@testing-library/react-native'
import { playlistsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminPlaylistDetailScreen } from './AdminPlaylistDetailScreen'

// MarqueeText renders the title twice (visible + measurer), so a single-Text
// stub keeps text queries unambiguous in list-row tests.
jest.mock('shared/ui/marquee-text/marquee-text', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: ({ testID, text }: { testID?: string; text: string }) => (
      <Text testID={testID}>{text}</Text>
    ),
  }
})

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

jest.mock('expo-router', () => {
  const React = jest.requireActual('react') as {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => unknown
    Fragment: unknown
  }

  return {
    Stack: {
      // Delete now lives in the header (headerRight). Render it so the test can press it.
      Screen: ({ options }: { options?: { headerRight?: () => unknown } }) =>
        options?.headerRight
          ? React.createElement(React.Fragment, null, options.headerRight())
          : null,
    },
    useFocusEffect: (callback: () => () => void | void) => {
      const { useEffect } = jest.requireActual('react') as {
        useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
      }
      useEffect(callback, [callback])
    },
    useLocalSearchParams: () => ({ id: 'p1' }),
    useRouter: () => ({ back: mockBack, push: mockPush }),
  }
})

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
  playlist.sections = [playlist.sections[0]]

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

  test('renders the sections the playlist belongs to', async () => {
    const playlist = createPlaylist()
    mockFindOne.mockResolvedValue(playlist)

    const { findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)

    expect(await findByText('Разделы (1)')).toBeTruthy()
    expect(await findByText(playlist.sections[0].title)).toBeTruthy()
  })

  test('opens the admin section detail when a section row is pressed', async () => {
    const playlist = createPlaylist()
    const section = playlist.sections[0]
    mockFindOne.mockResolvedValue(playlist)

    const { findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)
    fireEvent.press(await findByText(section.title))

    expect(mockPush).toHaveBeenCalledWith({
      params: { id: section.id },
      pathname: '/admin/sections/[id]',
    })
  })

  test('omits the sections block when the playlist belongs to no sections', async () => {
    const playlist = createPlaylist()
    playlist.sections = []
    mockFindOne.mockResolvedValue(playlist)

    const { findByText, queryByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)

    expect(await findByText('Проповеди плейлиста (1)')).toBeTruthy()
    expect(queryByText('Разделы (0)')).toBeNull()
  })

  test('shows the not-found state when the playlist is missing', async () => {
    mockFindOne.mockRejectedValue(new Error('404'))

    const { findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)

    expect(await findByText('Плейлист не найден')).toBeTruthy()
  })

  test('deletes the playlist and navigates back after confirmation', async () => {
    mockFindOne.mockResolvedValue(createPlaylist())

    const { findByLabelText, findByText, getAllByText } = await renderWithProviders(
      <AdminPlaylistDetailScreen />,
    )
    fireEvent.press(await findByLabelText('Удалить'))

    // The dialog mounts inside RN Modal; its confirm button shares the «Удалить»
    // label with the header action.
    expect(await findByText('Удалить плейлист?')).toBeTruthy()
    const confirmButtons = getAllByText('Удалить', { includeHiddenElements: true })
    fireEvent.press(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('p1'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})
