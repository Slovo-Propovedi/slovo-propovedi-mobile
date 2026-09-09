import { type PlaylistData, type SermonData } from 'shared/model'
import { computePlaylistHistoryFlags } from './usePlaylistHistoryMenu'

jest.mock('entities/listening-history', () => ({
  markSermonsListenedAction: jest.fn(),
  removeSermonsFromHistoryAction: jest.fn(),
  useHistoryProgressMap: jest.fn(),
  useHistorySermonIds: jest.fn(),
}))

const makeSermon = (id: string, audioUrl?: null | string): SermonData => ({
  artist: 'Автор',
  artwork: null,
  audioUrl,
  id,
  title: id,
})

const makePlaylist = (sermons: SermonData[]): PlaylistData => ({
  artwork: null,
  id: 'pl-1',
  sermons,
  title: 'Плейлист',
})

describe('computePlaylistHistoryFlags', () => {
  test('playable incomplete sermon -> canMarkAll true, canRemoveFromHistory false', () => {
    const playlist = makePlaylist([makeSermon('s1', 'https://example.com/1.mp3')])

    const flags = computePlaylistHistoryFlags(playlist, new Map(), new Set())

    expect(flags.canMarkAll).toBe(true)
    expect(flags.canRemoveFromHistory).toBe(false)
  })

  test('playable completed sermon (in history + progress 1) -> canMarkAll false', () => {
    const playlist = makePlaylist([makeSermon('s1', 'https://example.com/1.mp3')])
    const progressMap = new Map([['s1', 1]])
    const historySermonIds = new Set(['s1'])

    const flags = computePlaylistHistoryFlags(playlist, progressMap, historySermonIds)

    expect(flags.canMarkAll).toBe(false)
    expect(flags.canRemoveFromHistory).toBe(true)
  })

  test('non-playable sermon in history -> canRemoveFromHistory true, canMarkAll false', () => {
    const playlist = makePlaylist([makeSermon('s1', null)])
    const historySermonIds = new Set(['s1'])

    const flags = computePlaylistHistoryFlags(playlist, new Map(), historySermonIds)

    expect(flags.canRemoveFromHistory).toBe(true)
    expect(flags.canMarkAll).toBe(false)
  })

  test('nothing in history -> both flags false', () => {
    const playlist = makePlaylist([makeSermon('s1', null)])

    const flags = computePlaylistHistoryFlags(playlist, new Map(), new Set())

    expect(flags.canRemoveFromHistory).toBe(false)
    expect(flags.canMarkAll).toBe(false)
  })
})
