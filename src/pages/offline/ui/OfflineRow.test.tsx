import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { type OfflineSermonItem } from 'features/offline-sermons'
import { useHistoryProgress } from 'entities/listening-history'
import { currentAudioAtom, usePlayNewSermon } from 'entities/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { OfflineRow } from './OfflineRow'

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

const mockPlayNewSermon = jest.fn()
const mockTrackItemProps: CapturedTrackItemProps[] = []
const mockReportError = jest.fn()

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'testCurrentAudioAtom'),
    usePlayNewSermon: jest.fn(() => jest.fn()),
  }
})

jest.mock('entities/listening-history', () => ({
  useHistoryProgress: jest.fn(() => undefined),
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: (...args: unknown[]) => mockReportError(...args),
}))

jest.mock('shared/ui/track-list', () => {
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
    jest.mocked(usePlayNewSermon).mockReturnValue(mockPlayNewSermon)
    jest.mocked(useHistoryProgress).mockReturnValue(undefined)
  })

  test('maps sermon and playlist data to TracksListItem', async () => {
    await renderWithProviders(<OfflineRow item={mockItem} isPlaying={false} />)

    expect(mockTrackItemProps[0]).toMatchObject({
      artwork: mockSermon.artwork,
      audioUrl: mockSermon.audioUrl,
      subtitle: mockItem.playlist.title,
      title: mockSermon.title,
    })
  })

  test('forwards history progress to TracksListItem', async () => {
    jest.mocked(useHistoryProgress).mockReturnValue(0.5)

    await renderWithProviders(<OfflineRow item={mockItem} isPlaying={false} />)

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

    await renderWithProviders(<OfflineRow item={mockItem} isPlaying={true} />, { ctx })

    expect(mockTrackItemProps[0].isPlaying).toBe(true)
    expect(mockTrackItemProps[0].isAudioPlaying).toBe(true)
  })

  test('row press plays the sermon with its playlist', async () => {
    const { getByTestId } = await renderWithProviders(
      <OfflineRow item={mockItem} isPlaying={false} />,
    )

    await act(async () => {
      fireEvent.press(getByTestId('tracks-list-item'))
    })

    expect(mockPlayNewSermon).toHaveBeenCalledWith({
      playlist: mockItem.playlist,
      sermon: mockItem.sermon,
    })
  })

  test('reports a playback error', async () => {
    mockPlayNewSermon.mockRejectedValueOnce(new Error('boom'))

    const { getByTestId } = await renderWithProviders(
      <OfflineRow item={mockItem} isPlaying={false} />,
    )

    await act(async () => {
      fireEvent.press(getByTestId('tracks-list-item'))
    })

    expect(mockReportError).toHaveBeenCalled()
  })
})
