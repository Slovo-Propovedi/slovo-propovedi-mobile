import { act } from '@testing-library/react-native'
import { type ListeningHistoryEntry, resolveEntryPlaylist } from 'entities/listening-history'
import { usePlayNewSermon } from 'entities/player'
import { renderHookWithProviders } from 'shared/mocks'
import { reportError } from 'shared/model/error-dialog'
import { useEntryPlayback } from './useEntryPlayback'

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(),
}))

jest.mock('entities/listening-history', () => ({
  getEntrySermon: jest.requireActual('entities/listening-history/lib/getEntrySermon')
    .getEntrySermon,
  resolveEntryPlaylist: jest.fn(),
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

const ERROR_MESSAGE = 'Не удалось воспроизвести проповедь из истории'

const makeSermon = (id: string, title = `Sermon ${id}`) => ({
  artist: 'Author',
  artwork: 'artwork.jpg',
  audioUrl: `https://example.com/${id}.mp3`,
  id,
  title,
})

const makeSlimEntry = (sermon?: ReturnType<typeof makeSermon>): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: sermon ? [sermon] : [],
    title: 'Playlist',
  },
  positionMs: 500,
})

describe('useEntryPlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('resolves the playlist and plays the entry sermon', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const sermon = makeSermon('sermon-1', 'Проповедь о надежде')
    const entry = makeSlimEntry(sermon)
    const resolvedPlaylist = { ...entry.playlist, title: 'Full Playlist' }
    jest.mocked(resolveEntryPlaylist).mockResolvedValue(resolvedPlaylist)

    const { result } = await renderHookWithProviders(() => useEntryPlayback(ERROR_MESSAGE))

    await act(async () => {
      await result.current(entry)
    })

    expect(resolveEntryPlaylist).toHaveBeenCalledWith(entry)
    expect(playNewSermonMock).toHaveBeenCalledWith({ playlist: resolvedPlaylist, sermon })
    expect(reportError).not.toHaveBeenCalled()
  })

  test('does nothing when the entry has no sermon', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const entry = makeSlimEntry()

    const { result } = await renderHookWithProviders(() => useEntryPlayback(ERROR_MESSAGE))

    await act(async () => {
      await result.current(entry)
    })

    expect(resolveEntryPlaylist).not.toHaveBeenCalled()
    expect(playNewSermonMock).not.toHaveBeenCalled()
    expect(reportError).not.toHaveBeenCalled()
  })

  test('reports the error when resolving the playlist fails', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const entry = makeSlimEntry(makeSermon('sermon-1'))
    const error = new Error('network down')
    jest.mocked(resolveEntryPlaylist).mockRejectedValue(error)

    const { result } = await renderHookWithProviders(() => useEntryPlayback(ERROR_MESSAGE))

    await act(async () => {
      await result.current(entry)
    })

    expect(reportError).toHaveBeenCalledWith(error, ERROR_MESSAGE)
    expect(playNewSermonMock).not.toHaveBeenCalled()
  })
})
