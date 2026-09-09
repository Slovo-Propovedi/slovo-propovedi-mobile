import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { LISTENING_HISTORY } from 'shared/config'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { recordPlaybackStartAction } from './recordPlaybackStart'

const mockAudio: AudioPlayerData = {
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
  sermons: [mockAudio],
  title: 'Test Playlist',
}

const makeEntry = (
  sermonId: string,
  overrides: Partial<ListeningHistoryEntry> = {},
): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: [
      {
        artist: 'Author',
        artwork: 'sermon.jpg',
        audioUrl: 'https://example.com/audio.mp3',
        id: sermonId,
        title: `Sermon ${sermonId}`,
      },
    ],
    title: 'Playlist',
  },
  positionMs: 500,
  ...overrides,
})

describe('recordPlaybackStartAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  test('prepends new entry to empty history', async () => {
    const ctx = createCtx()
    const before = Date.now()

    await recordPlaybackStartAction(ctx, mockAudio, mockPlaylist)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(getEntrySermon(atomState[0])?.id).toBe('sermon-1')
    expect(atomState[0].positionMs).toBe(0)
    expect(atomState[0].durationMs).toBe(0)
    expect(atomState[0].lastPlayedAt).toBeGreaterThanOrEqual(before)

    const stored = JSON.parse(
      (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
    ) as ListeningHistory
    expect(stored).toHaveLength(1)
    expect(getEntrySermon(stored[0])?.id).toBe('sermon-1')
  })

  test('resets completed entry to head with position 0', async () => {
    const completed = makeEntry('sermon-1', {
      durationMs: 3_600_000,
      lastPlayedAt: 100,
      positionMs: 3_595_000,
    })
    const ctx = createCtx()
    historyAtom(ctx, [completed])

    await recordPlaybackStartAction(ctx, mockAudio, mockPlaylist)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(getEntrySermon(atomState[0])?.id).toBe('sermon-1')
    expect(atomState[0].positionMs).toBe(0)
    expect(atomState[0].durationMs).toBe(0)
    expect(atomState[0].lastPlayedAt).toBeGreaterThan(100)
  })

  test('moves not-completed entry to head keeping position', async () => {
    const partial = makeEntry('sermon-1', {
      durationMs: 1000,
      lastPlayedAt: 100,
      positionMs: 500,
    })
    const other = makeEntry('sermon-2', { lastPlayedAt: 200 })
    const ctx = createCtx()
    historyAtom(ctx, [other, partial])

    await recordPlaybackStartAction(ctx, mockAudio, mockPlaylist)

    const atomState = ctx.get(historyAtom)
    expect(getEntrySermon(atomState[0])?.id).toBe('sermon-1')
    expect(atomState[0].positionMs).toBe(500)
    expect(atomState[0].durationMs).toBe(1000)
    expect(getEntrySermon(atomState[1])?.id).toBe('sermon-2')
  })

  test('merge branch strips playlists from audio and keeps entry/playlist consistent', async () => {
    const existingSermon: AudioPlayerData = {
      artist: 'Old Author',
      artwork: 'old.jpg',
      audioUrl: 'https://example.com/old.mp3',
      id: 'sermon-1',
      title: 'Old Title',
    }
    const existing = makeEntry('sermon-1', {
      durationMs: 2000,
      lastPlayedAt: 100,
      positionMs: 1000,
    })
    existing.playlist = {
      ...existing.playlist,
      sermons: [existingSermon],
    }
    const ctx = createCtx()
    historyAtom(ctx, [existing])

    const audioWithPlaylists = {
      ...mockAudio,
      playlists: [
        { artwork: 'extra.jpg', id: 'pl-extra', sermons: [], title: 'Extra' } as PlaylistData,
      ],
    } as AudioPlayerData
    await recordPlaybackStartAction(ctx, audioWithPlaylists, mockPlaylist)

    const entry = ctx.get(historyAtom)[0]
    const entrySermon = getEntrySermon(entry)
    expect(entrySermon).not.toHaveProperty('playlists')

    const merged = {
      artist: 'Author',
      artwork: 'sermon.jpg',
      audioUrl: 'https://example.com/audio.mp3',
      id: 'sermon-1',
      title: 'Test Sermon',
    }
    expect(entrySermon).toEqual(merged)
    expect(entry.playlist.sermons[0]).toEqual(merged)
  })
})
