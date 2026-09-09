import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { removeHistoryEntryAction } from '../model/history'
import { buildHistoryMenuActions } from './buildHistoryMenuActions'
import { markSermonListenedAction } from './markSermonListened'

jest.mock('../model/history', () => ({
  removeHistoryEntryAction: jest.fn(),
}))

jest.mock('./markSermonListened', () => ({
  markSermonListenedAction: jest.fn(),
}))

const mockSermon: AudioPlayerData = {
  artist: 'Author',
  artwork: 'sermon.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}

const mockPlaylist: PlaylistData = {
  artwork: 'playlist.jpg',
  description: 'A test playlist',
  id: 'pl-1',
  sermons: [mockSermon],
  title: 'Test Playlist',
}

describe('buildHistoryMenuActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns mark-only action when sermon is not in history', () => {
    const actions = buildHistoryMenuActions({
      inHistory: false,
      isCompleted: false,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    expect(actions).toHaveLength(1)
    expect(actions[0].icon).toBe('checkmark-done')
    expect(actions[0].text).toBe('Пометить прослушанной')
  })

  test('returns mark and remove actions when sermon is in history and partial', () => {
    const actions = buildHistoryMenuActions({
      inHistory: true,
      isCompleted: false,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    expect(actions).toHaveLength(2)
    expect(actions[0].text).toBe('Пометить прослушанной')
    expect(actions[1].text).toBe('Удалить из истории')
  })

  test('returns remove-only action when sermon is completed', () => {
    const actions = buildHistoryMenuActions({
      inHistory: true,
      isCompleted: true,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    expect(actions).toHaveLength(1)
    expect(actions[0].icon).toBe('trash-outline')
    expect(actions[0].text).toBe('Удалить из истории')
  })

  test('returns mark-only action when completed but not in history (isCompleted ignored)', () => {
    const actions = buildHistoryMenuActions({
      inHistory: false,
      isCompleted: true,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    expect(actions).toHaveLength(1)
    expect(actions[0].icon).toBe('checkmark-done')
    expect(actions[0].text).toBe('Пометить прослушанной')
  })

  test('mark action calls markSermonListenedAction with sermon and playlist', () => {
    const actions = buildHistoryMenuActions({
      inHistory: false,
      isCompleted: false,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    actions[0].onPress()

    expect(markSermonListenedAction).toHaveBeenCalledTimes(1)
    expect(jest.mocked(markSermonListenedAction).mock.calls[0][1]).toEqual(mockSermon)
    expect(jest.mocked(markSermonListenedAction).mock.calls[0][2]).toEqual(mockPlaylist)
  })

  test('remove action calls removeHistoryEntryAction with sermon id', () => {
    const actions = buildHistoryMenuActions({
      inHistory: true,
      isCompleted: true,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    actions[0].onPress()

    expect(removeHistoryEntryAction).toHaveBeenCalledTimes(1)
    expect(jest.mocked(removeHistoryEntryAction).mock.calls[0][1]).toBe('sermon-1')
  })
})
