import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import {
  clearHistoryAction,
  historyAtom,
  type ListeningHistoryEntry,
  removeHistoryEntryAction,
} from 'entities/listening-history'
import { usePlayNewSermon } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { type PlaylistData } from 'shared/model'
import { HistoryHeaderMenu } from './HistoryHeaderMenu'
import { HistoryScreen } from './HistoryScreen'

const mockResolveEntryPlaylist = jest.fn()

jest.mock('../lib/resolveEntryPlaylist', () => ({
  resolveEntryPlaylist: (...args: unknown[]) => mockResolveEntryPlaylist(...args),
}))

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
    MaterialCommunityIcons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('expo-router', () => ({
  useNavigation: () => ({ setOptions: jest.fn() }),
}))

jest.mock('entities/listening-history', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    clearHistoryAction: jest.fn(),
    getEntrySermon: (entry: { playlist: { sermons: unknown[] }; sermon?: unknown }) =>
      entry.sermon ?? entry.playlist.sermons[0],
    historyAtom: atom([], 'testHistoryAtom'),
    removeHistoryEntryAction: jest.fn(),
  }
})

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'testCurrentAudioAtom'),
    isPlayingAtom: atom(false, 'testIsPlayingAtom'),
    usePlayNewSermon: jest.fn(() => jest.fn()),
  }
})

jest.mock('shared/ui/track-list', () => {
  const { Pressable, StyleSheet, Text, View } = jest.requireActual('react-native')
  const TracksListItem = (props: {
    menuActions?: Array<{ onPress: () => void; text: string }>
    onPress: () => void
    subtitle?: string
    title: string
  }) => (
    <View testID='tracks-list-item'>
      <Text>{props.title}</Text>
      {props.subtitle && <Text>{props.subtitle}</Text>}
      <Pressable onPress={props.onPress} testID='tracks-list-item-press'>
        <Text>Play</Text>
      </Pressable>
      {props.menuActions?.map((action, i) => (
        <Pressable key={i} onPress={action.onPress} testID={`menu-action-${i}`}>
          <Text>{action.text}</Text>
        </Pressable>
      ))}
    </View>
  )

  return {
    createTracksListStyles: () => StyleSheet.create({ container: {}, divider: {} }),
    TracksListItem,
  }
})

const MOCK_SERMON_ID = 'sermon-1'
const MOCK_SERMON_TITLE = 'Проповедь о вере'

const mockSermon = {
  artist: 'Test Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: MOCK_SERMON_ID,
  title: MOCK_SERMON_TITLE,
}

const mockEntry: ListeningHistoryEntry = {
  durationMs: 120000,
  lastPlayedAt: Date.now() - 3600000,
  playlist: {
    artwork: 'https://example.com/playlist.jpg',
    id: 'playlist-1',
    sermons: [],
    title: 'Test Playlist',
  },
  positionMs: 30000,
  sermon: mockSermon,
}

const seedHistory = (entries: ListeningHistoryEntry[] = []) => {
  const ctx = createCtx()
  historyAtom(ctx, entries)
  return ctx
}

describe('<HistoryScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResolveEntryPlaylist.mockImplementation((entry: ListeningHistoryEntry) =>
      Promise.resolve(entry.playlist),
    )
  })

  test('renders entries with titles and subtitles', async () => {
    const ctx = seedHistory([mockEntry])

    const { getByText } = await renderWithProviders(<HistoryScreen />, { ctx })

    expect(getByText(MOCK_SERMON_TITLE)).toBeTruthy()
  })

  test('shows empty state when history is empty', async () => {
    const ctx = seedHistory([])

    const { getByText } = await renderWithProviders(<HistoryScreen />, { ctx })

    expect(getByText('История пуста')).toBeTruthy()
  })

  test('row press calls playNewSermon with resolved playlist', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const ctx = seedHistory([mockEntry])

    const { getByTestId } = await renderWithProviders(<HistoryScreen />, { ctx })

    await act(async () => {
      fireEvent.press(getByTestId('tracks-list-item-press'))
    })

    expect(mockResolveEntryPlaylist).toHaveBeenCalledWith(mockEntry)
    expect(playNewSermonMock).toHaveBeenCalledWith({
      playlist: mockEntry.playlist,
      sermon: mockSermon,
    })
  })

  test('row press passes resolved playlist (different from snapshot) to playNewSermon', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const resolvedPlaylist: PlaylistData = {
      artwork: 'resolved.jpg',
      description: 'Full playlist',
      id: 'playlist-1',
      sermons: [mockSermon, { artist: 'B', artwork: 'b.jpg', id: 'sermon-2', title: 'Sermon 2' }],
      title: 'Full Playlist',
    }
    mockResolveEntryPlaylist.mockResolvedValue(resolvedPlaylist)

    const ctx = seedHistory([mockEntry])

    const { getByTestId } = await renderWithProviders(<HistoryScreen />, { ctx })

    await act(async () => {
      fireEvent.press(getByTestId('tracks-list-item-press'))
    })

    expect(playNewSermonMock).toHaveBeenCalledWith({
      playlist: resolvedPlaylist,
      sermon: mockSermon,
    })
  })

  test('remove menu action calls removeHistoryEntryAction with sermon id', async () => {
    const ctx = seedHistory([mockEntry])

    const { getByTestId } = await renderWithProviders(<HistoryScreen />, { ctx })

    fireEvent.press(getByTestId('menu-action-0'))
    expect(removeHistoryEntryAction).toHaveBeenCalledTimes(1)
    expect(jest.mocked(removeHistoryEntryAction).mock.calls[0][1]).toBe(MOCK_SERMON_ID)
  })

  test('clear flow: open menu, select clear, confirm, clearHistoryAction called', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<HistoryHeaderMenu />)

    await act(async () => {
      fireEvent.press(getByTestId('history-header-menu'))
    })
    const clearMenuItem = await waitFor(() => getByText('Очистить историю'))
    fireEvent.press(clearMenuItem)
    const confirmButton = await waitFor(() => getByText('Очистить'))
    fireEvent.press(confirmButton)

    expect(clearHistoryAction).toHaveBeenCalledTimes(1)
  })
})
