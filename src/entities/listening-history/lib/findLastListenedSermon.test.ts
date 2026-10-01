import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import { type ListeningHistoryEntry } from '../model/types'
import { findLastListenedSermon } from './findLastListenedSermon'

const makeEntry = (
  sermonId: string,
  lastPlayedAt: number,
  overrides: Partial<ListeningHistoryEntry> = {},
): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt,
  playlist: {
    artwork: null,
    id: 'pl-context',
    sermons: [],
    title: 'Context Playlist',
  },
  positionMs: 500,
  sermon: {
    artist: 'Author',
    artwork: null,
    audioUrl: 'https://example.com/audio.mp3',
    id: sermonId,
    title: `Sermon ${sermonId}`,
  },
  ...overrides,
})

const PLAYLIST: PlaylistData = {
  artwork: null,
  description: '',
  id: 'pl-1',
  sermons: [
    {
      artist: 'A',
      artwork: null,
      audioUrl: 'https://example.com/1.mp3',
      id: 'sermon-1',
      title: '1',
    },
    {
      artist: 'A',
      artwork: null,
      audioUrl: 'https://example.com/2.mp3',
      id: 'sermon-2',
      title: '2',
    },
  ],
  title: 'Playlist',
}

describe('findLastListenedSermon', () => {
  test('returns null when history is empty', () => {
    expect(findLastListenedSermon(PLAYLIST, [])).toBeNull()
  })

  test('returns null when no history entry belongs to the playlist', () => {
    const history = [makeEntry('other-1', 100), makeEntry('other-2', 200)]

    expect(findLastListenedSermon(PLAYLIST, history)).toBeNull()
  })

  test('ignores entries whose sermon does not resolve', () => {
    const noSermon: ListeningHistoryEntry = {
      durationMs: 1000,
      lastPlayedAt: 500,
      playlist: { artwork: null, id: 'x', sermons: [], title: 'X' },
      positionMs: 0,
    }
    const history = [noSermon, makeEntry('sermon-1', 100)]

    expect(findLastListenedSermon(PLAYLIST, history)?.sermon?.id).toBe('sermon-1')
  })

  test('returns the entry with the greatest lastPlayedAt among playlist sermons', () => {
    const older = makeEntry('sermon-1', 100)
    const newer = makeEntry('sermon-2', 900)
    const history = [newer, older]

    expect(findLastListenedSermon(PLAYLIST, history)).toBe(newer)
  })

  test('skips playlist-external entries even when more recent', () => {
    const inPlaylist = makeEntry('sermon-1', 100)
    const external = makeEntry('other-1', 9999)

    expect(findLastListenedSermon(PLAYLIST, [external, inPlaylist])).toBe(inPlaylist)
  })
})
