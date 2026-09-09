import { buildHistoryMenuActions } from 'entities/listening-history'
import { usePlayNewSermon } from 'entities/player'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { usePlaylistActions } from './usePlaylistActions'

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => [
    { icon: 'checkmark-done', onPress: jest.fn(), text: 'Пометить прослушанной' },
  ]),
}))

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(() => jest.fn()),
}))

const SERMON_1 = {
  artist: 'Автор',
  artwork: 'art1.jpg',
  audioUrl: 'https://example.com/1.mp3',
  id: 'sermon-1',
  title: 'Первая',
}

const SERMON_2 = {
  artist: 'Автор',
  artwork: 'art2.jpg',
  audioUrl: null,
  id: 'sermon-2',
  title: 'Вторая',
}

const PLAYLIST = {
  artwork: null,
  description: '',
  id: 'pl-1',
  sermons: [SERMON_1, SERMON_2],
  title: 'Плейлист',
}

describe('usePlaylistActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('buildMenuActions builds history actions for playable sermon', async () => {
    const { result } = await renderHookWithProviders(
      () => usePlaylistActions([SERMON_1, SERMON_2], PLAYLIST, new Set(), new Map()),
      {},
    )

    const actions = result.current.buildMenuActions(0)

    expect(buildHistoryMenuActions).toHaveBeenCalledWith({
      inHistory: false,
      isCompleted: false,
      playlist: PLAYLIST,
      sermon: expect.objectContaining({ id: 'sermon-1' }),
    })
    expect(actions).toBeDefined()
  })

  test('buildMenuActions passes inHistory and isCompleted from history state', async () => {
    const historySermonIds = new Set(['sermon-1'])
    const progressMap = new Map([['sermon-1', 1]])

    const { result } = await renderHookWithProviders(
      () => usePlaylistActions([SERMON_1], PLAYLIST, historySermonIds, progressMap),
      {},
    )

    result.current.buildMenuActions(0)

    expect(buildHistoryMenuActions).toHaveBeenCalledWith({
      inHistory: true,
      isCompleted: true,
      playlist: PLAYLIST,
      sermon: expect.objectContaining({ id: 'sermon-1' }),
    })
  })

  test('buildMenuActions returns undefined for sermon without audioUrl', async () => {
    const { result } = await renderHookWithProviders(
      () => usePlaylistActions([SERMON_2], PLAYLIST, new Set(), new Map()),
      {},
    )

    expect(result.current.buildMenuActions(0)).toBeUndefined()
  })

  test('handlePressItem plays sermon with playlist', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const { result } = await renderHookWithProviders(
      () => usePlaylistActions([SERMON_1], PLAYLIST, new Set(), new Map()),
      {},
    )

    await result.current.handlePressItem(0)

    expect(playNewSermonMock).toHaveBeenCalledWith({ playlist: PLAYLIST, sermon: SERMON_1 })
  })

  test('handlePressItem no-ops for sermon without audioUrl', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const { result } = await renderHookWithProviders(
      () => usePlaylistActions([SERMON_2], PLAYLIST, new Set(), new Map()),
      {},
    )

    await result.current.handlePressItem(0)

    expect(playNewSermonMock).not.toHaveBeenCalled()
  })

  test('handlePressPlayAll plays first playable sermon', async () => {
    const playNewSermonMock = jest.fn()
    jest.mocked(usePlayNewSermon).mockReturnValue(playNewSermonMock)

    const { result } = await renderHookWithProviders(
      () => usePlaylistActions([SERMON_2, SERMON_1], PLAYLIST, new Set(), new Map()),
      {},
    )

    await result.current.handlePressPlayAll()

    expect(playNewSermonMock).toHaveBeenCalledWith({ playlist: PLAYLIST, sermon: SERMON_1 })
  })
})
