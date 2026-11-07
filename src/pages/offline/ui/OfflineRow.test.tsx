import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { type OfflineSermonItem } from 'features/offline-sermons'
import { useHistoryProgress } from 'entities/listening-history'
import { currentAudioAtom } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { OfflineRow } from './OfflineRow'

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

interface CapturedTrackItemProps {
  artwork?: null | string
  audioUrl?: string
  isAudioPlaying?: boolean
  isPlaying: boolean
  onPress: () => void
  progress?: number
  subtitle?: string
  title: string
}

const mockTrackItemProps: CapturedTrackItemProps[] = []
const mockOnPress = jest.fn()

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'testCurrentAudioAtom'),
  }
})

jest.mock('entities/listening-history', () => ({
  useHistoryProgress: jest.fn(() => undefined),
}))

jest.mock('entities/track-list', () => {
  const { View } = jest.requireActual('react-native')
  return {
    TracksListItem: (props: CapturedTrackItemProps) => {
      mockTrackItemProps.push(props)
      return <View testID='tracks-list-item' />
    },
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
    artwork: null,
    id: 'playlist-1',
    sermons: [mockSermon],
    title: 'Плейлист 1',
  },
  sermon: mockSermon,
}

describe('<OfflineRow>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTrackItemProps.length = 0
    jest.mocked(useHistoryProgress).mockReturnValue(undefined)
  })

  test('maps sermon and playlist data to TracksListItem', async () => {
    await renderWithProviders(
      <OfflineRow item={mockItem} isPlaying={false} onPress={mockOnPress} />,
    )

    expect(mockTrackItemProps[0]).toMatchObject({
      artwork: mockSermon.artwork,
      audioUrl: mockSermon.audioUrl,
      subtitle: mockItem.playlist.title,
      title: mockSermon.title,
    })
  })

  test('forwards history progress to TracksListItem', async () => {
    jest.mocked(useHistoryProgress).mockReturnValue(0.5)

    await renderWithProviders(
      <OfflineRow item={mockItem} isPlaying={false} onPress={mockOnPress} />,
    )

    expect(useHistoryProgress).toHaveBeenCalledWith(mockSermon.id)
    expect(mockTrackItemProps[0].progress).toBe(0.5)
  })

  test('marks the row playing when the sermon is the current audio and audio is playing', async () => {
    const ctx = createCtx()
    currentAudioAtom(ctx, {
      artist: mockSermon.artist,
      artwork: mockSermon.artwork,
      audioUrl: mockSermon.audioUrl,
      id: mockSermon.id,
      title: mockSermon.title,
    })

    await renderWithProviders(
      <OfflineRow item={mockItem} isPlaying={true} onPress={mockOnPress} />,
      { ctx },
    )

    expect(mockTrackItemProps[0].isPlaying).toBe(true)
    expect(mockTrackItemProps[0].isAudioPlaying).toBe(true)
  })

  test('row press forwards the item to the injected onPress', async () => {
    const { getByTestId } = await renderWithProviders(
      <OfflineRow item={mockItem} isPlaying={false} onPress={mockOnPress} />,
    )

    await act(async () => {
      fireEvent.press(getByTestId('tracks-list-item'))
    })

    expect(mockOnPress).toHaveBeenCalledWith(mockItem)
  })

  test('does not re-render when the parent passes identical props', async () => {
    const { rerender } = await renderWithProviders(
      <OfflineRow item={mockItem} isPlaying={false} onPress={mockOnPress} />,
    )
    const rendersAfterMount = mockTrackItemProps.length

    await rerender(<OfflineRow item={mockItem} isPlaying={false} onPress={mockOnPress} />)

    expect(mockTrackItemProps).toHaveLength(rendersAfterMount)
  })
})
