import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { useNavigation } from 'expo-router'
import { type OfflineSermonItem, useOfflineSermons } from 'features/offline-sermons'
import { sermonCachingEnabledAtom } from 'entities/offline-cache'
import { usePlayNewSermon } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { OfflineScreen } from './OfflineScreen'

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

jest.mock('entities/track-list', () => {
  const { Pressable, StyleSheet, Text, View: RNView } = jest.requireActual('react-native')
  const TracksListItem = (props: { onPress: () => void; subtitle?: string; title: string }) => (
    <RNView testID='tracks-list-item'>
      <Text>{props.title}</Text>
      {props.subtitle && <Text>{props.subtitle}</Text>}
      <Pressable onPress={props.onPress}>
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

const CACHING_OFF_HINT_TEXT = 'Включите тумблер в шапке экрана'
const CACHING_OFF_TEXT = 'Сохранение в офлайн отключено'
const NO_SERMONS_TEXT = 'Нет офлайн-проповедей'

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

    expect(getByText(NO_SERMONS_TEXT)).toBeTruthy()
  })

  test('explains the empty list when offline saving is switched off', async () => {
    jest.mocked(useOfflineSermons).mockReturnValue({ isLoading: false, items: [] })
    const ctx = createCtx()
    sermonCachingEnabledAtom(ctx, false)

    const { getByText, queryByText } = await renderWithProviders(<OfflineScreen />, { ctx })

    expect(getByText(CACHING_OFF_TEXT)).toBeTruthy()
    expect(getByText(CACHING_OFF_HINT_TEXT)).toBeTruthy()
    expect(queryByText(NO_SERMONS_TEXT)).toBeNull()
  })

  test('shows skeleton rows on first load instead of the empty state', async () => {
    jest.mocked(useOfflineSermons).mockReturnValue({ isLoading: true, items: [] })

    const { getAllByTestId, queryByText } = await renderWithProviders(<OfflineScreen />)

    expect(getAllByTestId('tracks-list-item-skeleton')).toHaveLength(6)
    expect(queryByText(NO_SERMONS_TEXT)).toBeNull()
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

    const { getByText } = await renderWithProviders(<OfflineScreen />)

    await act(async () => {
      fireEvent.press(getByText('Play'))
    })

    expect(playNewSermonMock).toHaveBeenCalledWith({
      playlist: mockItem.playlist,
      sermon: mockItem.sermon,
    })
  })
})
