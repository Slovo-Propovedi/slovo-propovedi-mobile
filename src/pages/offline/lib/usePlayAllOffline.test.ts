import { act } from '@testing-library/react-native'
import { type OfflineSermonItem } from 'features/offline-sermons'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { reportError } from 'shared/model/error-dialog'
import { usePlayAllOffline } from './usePlayAllOffline'

const mockPlayNewSermon = jest.fn()

jest.mock('entities/player', () => ({
  usePlayNewSermon: () => mockPlayNewSermon,
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

const mockedReportError = jest.mocked(reportError)

const OFFLINE_ERROR_MESSAGE = 'Не удалось воспроизвести офлайн-проповедь'

const playlist = { artwork: null, id: 'playlist-1', sermons: [], title: 'Плейлист' }

const offlineItems: OfflineSermonItem[] = [
  {
    playlist,
    sermon: {
      artist: 'Автор',
      artwork: null,
      audioUrl: 'https://cdn/sermon-1.mp3',
      id: 'sermon-1',
      title: 'Первая проповедь',
    },
  },
  {
    playlist,
    sermon: {
      artist: 'Автор',
      artwork: null,
      audioUrl: 'https://cdn/sermon-2.mp3',
      id: 'sermon-2',
      title: 'Вторая проповедь',
    },
  },
]

describe('usePlayAllOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPlayNewSermon.mockResolvedValue(undefined)
  })

  test('plays every offline sermon as one queue starting from the first', async () => {
    const { result } = await renderHookWithProviders(() => usePlayAllOffline(offlineItems))

    await act(async () => {
      result.current()
    })

    expect(mockPlayNewSermon).toHaveBeenCalledWith({
      playlist: {
        artwork: null,
        description: '',
        id: 'offline-list',
        sermons: offlineItems.map(item => item.sermon),
        title: 'Офлайн',
      },
      sermon: offlineItems[0].sermon,
    })
  })

  test('does nothing when the offline list is empty', async () => {
    const { result } = await renderHookWithProviders(() => usePlayAllOffline([]))

    await act(async () => {
      result.current()
    })

    expect(mockPlayNewSermon).not.toHaveBeenCalled()
  })

  test('reports a playback failure with the offline message', async () => {
    mockPlayNewSermon.mockRejectedValueOnce(new Error('boom'))
    const { result } = await renderHookWithProviders(() => usePlayAllOffline(offlineItems))

    await act(async () => {
      result.current()
    })

    expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), OFFLINE_ERROR_MESSAGE)
  })
})
