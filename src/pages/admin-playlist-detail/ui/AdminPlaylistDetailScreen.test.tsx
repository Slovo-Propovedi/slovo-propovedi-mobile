import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { playlistsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { mockMeasureInWindow } from 'shared/mocks/measure'
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
const mockSermonUpdate = jest.fn()
const mockShowToast = jest.fn()

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({
      playlistControllerFindOne: mockFindOne,
      playlistControllerRemove: mockRemove,
      reorderSermonsInPlaylist: mockReorder,
    }),
  },
  sermonsApi: {
    getSermons: () => ({ sermonControllerUpdate: mockSermonUpdate }),
  },
}))

jest.mock('shared/model', () => ({
  ...jest.requireActual('shared/model'),
  showToast: (...args: unknown[]) => mockShowToast(...args),
}))

// The real dropdown gates presses behind an onLayout measurement; a Pressable
// stub keeps the item pressable under test.
jest.mock('shared/ui/menu', () => {
  const { Pressable, Text } = jest.requireActual('react-native')

  return {
    MenuDropdown: ({
      items,
      visible,
    }: {
      items: Array<{ onPress: () => void; text: string }>
      visible: boolean
    }) =>
      visible ? (
        <>
          {items.map(item => (
            <Pressable key={item.text} onPress={item.onPress}>
              <Text>{item.text}</Text>
            </Pressable>
          ))}
        </>
      ) : null,
  }
})

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

const PLAYLIST_ARTWORK = 'https://cdn.example.com/playlist.jpg'
const MENU_BUTTON_LABEL = 'Меню проповедей плейлиста'
const MENU_ITEM_TEXT = 'Установить обложки из плейлиста'
const DIALOG_TITLE = 'Установить обложки из плейлиста?'
const CONFIRM_TEXT = 'ОК'
const NO_ARTWORK_MESSAGE = 'У плейлиста нет обложки'
const UPDATED_MESSAGE = 'Обложки обновлены'

describe('<AdminPlaylistDetailScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemove.mockResolvedValue({ status: 'ok' })
    mockSermonUpdate.mockResolvedValue({ status: 'ok' })
    mockMeasureInWindow({ height: 44, width: 44, x: 0, y: 0 })
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
    await act(async () => {
      await fireEvent.press(await findByLabelText('Удалить'))
    })

    // The dialog mounts inside RN Modal; its confirm button shares the «Удалить»
    // label with the header action.
    expect(await findByText('Удалить плейлист?')).toBeTruthy()
    const confirmButtons = getAllByText('Удалить', { includeHiddenElements: true })
    await act(async () => {
      await fireEvent.press(confirmButtons[confirmButtons.length - 1])
    })

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('p1'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })

  test('sets every sermon artwork from the playlist artwork', async () => {
    const playlist = createPlaylist()
    const firstSermon = playlist.sermons[0]
    const secondSermon = { ...firstSermon, id: 'sermon-2' }
    playlist.artwork = PLAYLIST_ARTWORK
    playlist.sermons = [firstSermon, secondSermon]
    mockFindOne.mockResolvedValue(playlist)

    const { findByLabelText, findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)

    fireEvent.press(await findByLabelText(MENU_BUTTON_LABEL))
    fireEvent.press(await findByText(MENU_ITEM_TEXT))

    expect(await findByText(DIALOG_TITLE, { includeHiddenElements: true })).toBeTruthy()
    fireEvent.press(await findByText(CONFIRM_TEXT, { includeHiddenElements: true }))

    await waitFor(() => expect(mockSermonUpdate).toHaveBeenCalledTimes(2))
    expect(mockSermonUpdate).toHaveBeenNthCalledWith(
      1,
      firstSermon.id,
      expect.objectContaining({
        artwork: PLAYLIST_ARTWORK,
        playlistsIds: firstSermon.playlists.map(item => item.id),
      }),
    )
    expect(mockSermonUpdate).toHaveBeenNthCalledWith(
      2,
      secondSermon.id,
      expect.objectContaining({ artwork: PLAYLIST_ARTWORK }),
    )
    expect(mockShowToast).toHaveBeenCalledWith(expect.anything(), UPDATED_MESSAGE)
  })

  test('shows a toast and skips updates when the playlist has no artwork', async () => {
    const playlist = createPlaylist()
    playlist.artwork = ''
    mockFindOne.mockResolvedValue(playlist)

    const { findByLabelText, findByText } = await renderWithProviders(<AdminPlaylistDetailScreen />)

    fireEvent.press(await findByLabelText(MENU_BUTTON_LABEL))
    fireEvent.press(await findByText(MENU_ITEM_TEXT))
    fireEvent.press(await findByText(CONFIRM_TEXT, { includeHiddenElements: true }))

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(expect.anything(), NO_ARTWORK_MESSAGE),
    )
    expect(mockSermonUpdate).not.toHaveBeenCalled()
  })
})
