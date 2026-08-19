import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/player'
import { LISTENING_HISTORY } from 'shared/config'
import { type PlaylistData } from 'shared/model'
import {
  clearHistoryAction,
  historyAtom,
  loadHistoryAction,
  markHistoryCompletedAction,
  recordPlaybackStartAction,
  removeHistoryEntryAction,
  updateHistoryProgressAction,
} from './history'
import { type ListeningHistory, type ListeningHistoryEntry } from './types'

jest.mock('entities/player', () => {
  const z = jest.requireActual('zod').default
  return {
    audioPlayerDataSchema: z.object({
      artist: z.string(),
      artwork: z.string(),
      audioUrl: z.string(),
      id: z.string(),
      title: z.string(),
    }),
  }
})

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
    sermons: [],
    title: 'Playlist',
  },
  positionMs: 500,
  sermon: {
    artist: 'Author',
    artwork: 'sermon.jpg',
    audioUrl: 'https://example.com/audio.mp3',
    id: sermonId,
    title: `Sermon ${sermonId}`,
  },
  ...overrides,
})

describe('listening-history model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  describe('loadHistoryAction', () => {
    test('loads entries from storage and sets atom', async () => {
      const entry = makeEntry('sermon-1')
      const data: ListeningHistory = [entry]
      await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify(data))

      const ctx = createCtx()
      await loadHistoryAction(ctx)

      expect(ctx.get(historyAtom)).toEqual(data)
    })

    test('sets atom to empty array when storage is empty', async () => {
      const ctx = createCtx()
      await loadHistoryAction(ctx)

      expect(ctx.get(historyAtom)).toEqual([])
    })
  })

  describe('recordPlaybackStartAction', () => {
    test('prepends new entry to empty history', async () => {
      const ctx = createCtx()
      const before = Date.now()

      await recordPlaybackStartAction(ctx, mockAudio, mockPlaylist)

      const atomState = ctx.get(historyAtom)
      expect(atomState).toHaveLength(1)
      expect(atomState[0].sermon.id).toBe('sermon-1')
      expect(atomState[0].positionMs).toBe(0)
      expect(atomState[0].durationMs).toBe(0)
      expect(atomState[0].lastPlayedAt).toBeGreaterThanOrEqual(before)

      const stored = JSON.parse(
        (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
      ) as ListeningHistory
      expect(stored).toHaveLength(1)
      expect(stored[0].sermon.id).toBe('sermon-1')
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
      expect(atomState[0].sermon.id).toBe('sermon-1')
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
      expect(atomState[0].sermon.id).toBe('sermon-1')
      expect(atomState[0].positionMs).toBe(500)
      expect(atomState[0].durationMs).toBe(1000)
      expect(atomState[1].sermon.id).toBe('sermon-2')
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
        sermon: existingSermon,
      })
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
      expect(entry.sermon).not.toHaveProperty('playlists')

      const merged = {
        artist: 'Author',
        artwork: 'sermon.jpg',
        audioUrl: 'https://example.com/audio.mp3',
        id: 'sermon-1',
        title: 'Test Sermon',
      }
      expect(entry.sermon).toEqual(merged)
      expect(entry.playlist.sermons[0]).toEqual(merged)
    })
  })

  describe('updateHistoryProgressAction', () => {
    test('no-op for unknown sermon id', async () => {
      const entry = makeEntry('sermon-1')
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await updateHistoryProgressAction(ctx, {
        durationMs: 2000,
        positionMs: 1000,
        sermonId: 'unknown',
      })

      expect(ctx.get(historyAtom)).toEqual([entry])
    })

    test('updates position and duration without changing lastPlayedAt', async () => {
      const entry = makeEntry('sermon-1', { lastPlayedAt: 100 })
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await updateHistoryProgressAction(ctx, {
        durationMs: 2000,
        positionMs: 800,
        sermonId: 'sermon-1',
      })

      const atomState = ctx.get(historyAtom)
      expect(atomState[0].positionMs).toBe(800)
      expect(atomState[0].durationMs).toBe(2000)
      expect(atomState[0].lastPlayedAt).toBe(100)
    })

    test('persists to storage', async () => {
      const entry = makeEntry('sermon-1')
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await updateHistoryProgressAction(ctx, {
        durationMs: 2000,
        positionMs: 800,
        sermonId: 'sermon-1',
      })

      const stored = JSON.parse(
        (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
      ) as ListeningHistory
      expect(stored[0].positionMs).toBe(800)
      expect(stored[0].durationMs).toBe(2000)
    })
  })

  describe('markHistoryCompletedAction', () => {
    test('sets positionMs equal to durationMs', async () => {
      const entry = makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await markHistoryCompletedAction(ctx, 'sermon-1')

      expect(ctx.get(historyAtom)[0].positionMs).toBe(1000)
    })

    test('no-op when entry missing', async () => {
      const entry = makeEntry('sermon-1')
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await markHistoryCompletedAction(ctx, 'unknown')

      expect(ctx.get(historyAtom)).toEqual([entry])
    })

    test('no-op when durationMs is 0', async () => {
      const entry = makeEntry('sermon-1', { durationMs: 0, positionMs: 0 })
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await markHistoryCompletedAction(ctx, 'sermon-1')

      expect(ctx.get(historyAtom)[0].positionMs).toBe(0)
    })
  })

  describe('removeHistoryEntryAction', () => {
    test('removes entry by sermon id', async () => {
      const e1 = makeEntry('sermon-1')
      const e2 = makeEntry('sermon-2')
      const ctx = createCtx()
      historyAtom(ctx, [e1, e2])

      await removeHistoryEntryAction(ctx, 'sermon-1')

      expect(ctx.get(historyAtom)).toHaveLength(1)
      expect(ctx.get(historyAtom)[0].sermon.id).toBe('sermon-2')
    })

    test('no-op when sermon id not found', async () => {
      const entry = makeEntry('sermon-1')
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await removeHistoryEntryAction(ctx, 'unknown')

      expect(ctx.get(historyAtom)).toHaveLength(1)
    })
  })

  describe('clearHistoryAction', () => {
    test('empties history atom and storage', async () => {
      const entry = makeEntry('sermon-1')
      const ctx = createCtx()
      historyAtom(ctx, [entry])

      await clearHistoryAction(ctx)

      expect(ctx.get(historyAtom)).toEqual([])

      const stored = JSON.parse(
        (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
      ) as ListeningHistory
      expect(stored).toEqual([])
    })
  })
})
