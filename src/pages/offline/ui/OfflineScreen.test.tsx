import { act, fireEvent } from '@testing-library/react-native'
import { useNavigation } from 'expo-router'
import { type OfflineSermonItem, useOfflineSermons } from 'features/offline-sermons'
import { usePlayNewSermon } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { OfflineScreen } from './OfflineScreen'

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
    MaterialCommunityIcons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('expo-router', () => ({
  useNavigation: jest.fn(() => ({ setOptions: jest.fn() })),
}))

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'testCurrentAudioAtom'),
    isPlayingAtom: atom(false, 'testIsPlayingAtom'),
    usePlayNewSermon: jest.fn(() => jest.fn()),
  }
})

jest.mock('features/offline-sermons', () => ({
  useOfflineSermons: jest.fn(),
}))

jest.mock('entities/listening-history', () => ({
  useHistoryProgress: jest.fn(() => undefined),
}))

jest.mock('shared/ui/track-list', () => {
  const { Pressable, StyleSheet, Text, View: RNView } = jest.requireActual('react-native')
  const TracksListItem = (props: { onPress: () => void; subtitle?: string; title: string }) => (
    <RNView testID='tracks-list-item'>
      <Text>{props.title}</Text>
      {props.subtitle && <Text>{props.subtitle}</Text>}
      <Pressable onPress={props.onPress} testID='tracks-list-item-press'>
        <Text>Play</Text>
      </Pressable>
    </RNView>
  )
  const TracksListSkeleton = ({ rowCount = 6 }: { rowCount?: number }) => (
    <>
      {Array.from({ length: rowCount }, (_, index) => (
        <RNView key={index} testID='tracks-list-item-skeleton' />
      ))}
    </>
  )

  return {
    createTracksListStyles: () => StyleSheet.create({ container: {}, divider: {} }),
    TracksListItem,
    TracksListSkeleton,
  }
})

const mockSermon = {
  artist: 'Test Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Офлайн-проповедь',
}

const mockItem: OfflineSermonItem = {
  playlist: {
    artwork: 'https://example.com/playlist.jpg',
    id: 'playlist-1',
    sermons: [mockSermon],
    title: 'Плейлист 1',
  },
  sermon: mockSermon,
}

describe('<OfflineScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useOfflineSermons).mockReturnValue({ isLoading: false, items: [mockItem] })
  })

  test('renders sermon titles', async () => {
    const { getByText } = await renderWithProviders(<OfflineScreen />)

    expect(getByText('Офлайн-проповедь')).toBeTruthy()
  })

  test('shows empty state when no offline sermons', async () => {
    jest.mocked(useOfflineSermons).mockReturnValue({ isLoading: false, items: [] })

    const { getByText } = await renderWithProviders(<OfflineScreen />)

    expect(getByText('Нет офлайн-проповедей')).toBeTruthy()
  })

  test('shows skeleton rows on first load instead of the empty state', async () => {
    jest.mocked(useOfflineSermons).mockReturnValue({ isLoading: true, items: [] })

    const { getAllByTestId, queryByText } = await renderWithProviders(<OfflineScreen />)

    expect(getAllByTestId('tracks-list-item-skeleton')).toHaveLength(6)
    expect(queryByText('Нет офлайн-проповедей')).toBeNull()
  })

  test('sets the offline header menu as headerRight', async () => {
    const setOptions = jest.fn()
    jest.mocked(useNavigation).mockReturnValue({ setOptions })

    await renderWithProviders(<OfflineScreen />)

    expect(setOptions).toHaveBeenCalledWith({ headerRight: expect.any(Function) })
  })

  test('row press calls playNewSermon with item playlist and sermon', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const { getByTestId } = await renderWithProviders(<OfflineScreen />)

    await act(async () => {
      fireEvent.press(getByTestId('tracks-list-item-press'))
    })

    expect(playNewSermonMock).toHaveBeenCalledWith({
      playlist: mockItem.playlist,
      sermon: mockItem.sermon,
    })
  })
})
