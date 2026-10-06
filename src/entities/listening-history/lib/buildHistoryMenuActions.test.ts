import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import { type AudioPlayerData } from 'entities/sermon/@x/listening-history'
import { buildHistoryMenuActions } from './buildHistoryMenuActions'
import { markSermonListenedAction } from './markSermonListened'
import { removeHistoryEntryAction } from './removeHistoryEntry'

jest.mock('./removeHistoryEntry', () => ({
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

const ADD_TO_PLAYLIST_TEXT = 'Добавить в плейлист'
const MARK_ACTION_TEXT = 'Пометить прослушанной'

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
    expect(actions[0].text).toBe(MARK_ACTION_TEXT)
  })

  test('returns mark and remove actions when sermon is in history and partial', () => {
    const actions = buildHistoryMenuActions({
      inHistory: true,
      isCompleted: false,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    expect(actions).toHaveLength(2)
    expect(actions[0].text).toBe(MARK_ACTION_TEXT)
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
    expect(actions[0].icon).toBe('time-outline')
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
    expect(actions[0].text).toBe(MARK_ACTION_TEXT)
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

  test('adds an add-to-playlist action first when a handler is provided', () => {
    const onAddToPlaylist = jest.fn()

    const actions = buildHistoryMenuActions({
      inHistory: false,
      isCompleted: false,
      onAddToPlaylist,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    expect(actions[0].icon).toBe('add-circle')
    expect(actions[0].text).toBe(ADD_TO_PLAYLIST_TEXT)

    actions[0].onPress()
    expect(onAddToPlaylist).toHaveBeenCalledWith(mockSermon)
  })

  test('omits the add-to-playlist action when no handler is provided', () => {
    const actions = buildHistoryMenuActions({
      inHistory: false,
      isCompleted: false,
      playlist: mockPlaylist,
      sermon: mockSermon,
    })

    expect(actions.some(action => action.text === ADD_TO_PLAYLIST_TEXT)).toBe(false)
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
