import { buildHistoryMenuActions, useHistorySermonIds } from 'entities/listening-history'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useSheetMenuActions } from './useSheetMenuActions'

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => [
    { icon: 'checkmark-done', onPress: jest.fn(), text: 'Пометить прослушанной' },
  ]),
  useHistorySermonIds: jest.fn(() => new Set<string>()),
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

describe('useSheetMenuActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useHistorySermonIds).mockReturnValue(new Set<string>())
  })

  test('builds history menu actions for playable sermon', async () => {
    const { result } = await renderHookWithProviders(
      () => useSheetMenuActions(PLAYLIST, new Map()),
      {},
    )

    const actions = result.current('sermon-1')

    expect(buildHistoryMenuActions).toHaveBeenCalledWith({
      inHistory: false,
      isCompleted: false,
      playlist: PLAYLIST,
      sermon: expect.objectContaining({ id: 'sermon-1' }),
    })
    expect(actions).toBeDefined()
  })

  test('passes inHistory and isCompleted from history state', async () => {
    jest.mocked(useHistorySermonIds).mockReturnValue(new Set(['sermon-1']))
    const progressMap = new Map([['sermon-1', 1]])

    const { result } = await renderHookWithProviders(
      () => useSheetMenuActions(PLAYLIST, progressMap),
      {},
    )

    result.current('sermon-1')

    expect(buildHistoryMenuActions).toHaveBeenCalledWith({
      inHistory: true,
      isCompleted: true,
      playlist: PLAYLIST,
      sermon: expect.objectContaining({ id: 'sermon-1' }),
    })
  })

  test('returns undefined for sermon without audioUrl', async () => {
    const { result } = await renderHookWithProviders(
      () => useSheetMenuActions(PLAYLIST, new Map()),
      {},
    )

    expect(result.current('sermon-2')).toBeUndefined()
  })

  test('returns undefined for unknown item id', async () => {
    const { result } = await renderHookWithProviders(
      () => useSheetMenuActions(PLAYLIST, new Map()),
      {},
    )

    expect(result.current('unknown')).toBeUndefined()
  })
})
