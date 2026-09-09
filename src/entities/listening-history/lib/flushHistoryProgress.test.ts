import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { LISTENING_HISTORY } from 'shared/config'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { MAX_HISTORY_ENTRIES } from './constants'
import { flushHistoryProgressAction } from './flushHistoryProgress'
import { getEntrySermon } from './getEntrySermon'
import * as liveProgressStorage from './liveProgressStorage'

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

describe('flushHistoryProgressAction', () => {
  let clearSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
    clearSpy = jest.spyOn(liveProgressStorage, 'clearLiveProgressSnapshot')
  })

  test('creates entry when missing', async () => {
    const ctx = createCtx()
    const before = Date.now()

    await flushHistoryProgressAction(ctx, {
      durationMs: 2000,
      playlist: mockPlaylist,
      positionMs: 1000,
      sermon: mockAudio,
    })

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    const created = atomState[0]
    expect(getEntrySermon(created)?.id).toBe('sermon-1')
    expect(created.positionMs).toBe(1000)
    expect(created.durationMs).toBe(2000)
    expect(created.lastPlayedAt).toBeGreaterThanOrEqual(before)
    expect(created.playlist.id).toBe('pl-1')
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  test('uses synthetic playlist fallback when none passed', async () => {
    const ctx = createCtx()

    await flushHistoryProgressAction(ctx, {
      durationMs: 2000,
      positionMs: 1000,
      sermon: mockAudio,
    })

    const created = ctx.get(historyAtom)[0]
    expect(created.playlist.id).toBe('sermon-1')
    expect(created.playlist.title).toBe('Test Sermon')
    expect(created.playlist.artwork).toBe('sermon.jpg')
    expect(created.playlist.description).toBe('')
    expect(created.playlist.sermons).toHaveLength(1)
    expect(created.playlist.sermons[0].id).toBe('sermon-1')
    expect(created.playlist.sermons[0]).not.toHaveProperty('playlists')
  })

  test('evicts the oldest entry when history is at the cap', async () => {
    const ctx = createCtx()
    const entries = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      makeEntry(`sermon-${i}`, { lastPlayedAt: i }),
    )
    historyAtom(ctx, entries)
    const freshSermon: AudioPlayerData = { ...mockAudio, id: 'fresh-sermon' }

    await flushHistoryProgressAction(ctx, {
      durationMs: 2000,
      positionMs: 1000,
      sermon: freshSermon,
    })

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(atomState.some(e => getEntrySermon(e)?.id === 'fresh-sermon')).toBe(true)
    expect(atomState.some(e => getEntrySermon(e)?.id === 'sermon-0')).toBe(false)
  })

  test('updates position and duration without changing lastPlayedAt', async () => {
    const entry = makeEntry('sermon-1', { lastPlayedAt: 100 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await flushHistoryProgressAction(ctx, {
      durationMs: 2000,
      positionMs: 800,
      sermon: mockAudio,
    })

    const atomState = ctx.get(historyAtom)
    expect(atomState[0].positionMs).toBe(800)
    expect(atomState[0].durationMs).toBe(2000)
    expect(atomState[0].lastPlayedAt).toBe(100)
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  test('persists to storage', async () => {
    const entry = makeEntry('sermon-1')
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await flushHistoryProgressAction(ctx, {
      durationMs: 2000,
      positionMs: 800,
      sermon: mockAudio,
    })

    const stored = JSON.parse(
      (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
    ) as ListeningHistory
    expect(stored[0].positionMs).toBe(800)
    expect(stored[0].durationMs).toBe(2000)
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  test('no-op when position and duration unchanged', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await flushHistoryProgressAction(ctx, {
      durationMs: 1000,
      positionMs: 500,
      sermon: mockAudio,
    })

    expect(ctx.get(historyAtom)).toEqual([entry])
    expect(clearSpy).not.toHaveBeenCalled()
  })

  test('writes a lower position when flushing backward (no max-clamping)', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 1000, positionMs: 800 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await flushHistoryProgressAction(ctx, {
      durationMs: 1000,
      positionMs: 300,
      sermon: mockAudio,
    })

    expect(ctx.get(historyAtom)[0].positionMs).toBe(300)
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  test('deferred flush skips completed entry (stale-flush protection)', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 3600000, positionMs: 3600000 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await flushHistoryProgressAction(ctx, {
      deferred: true,
      durationMs: 3600000,
      positionMs: 2000000,
      sermon: mockAudio,
    })

    expect(ctx.get(historyAtom)).toEqual([entry])
    expect(clearSpy).not.toHaveBeenCalled()
  })

  test('immediate flush updates completed entry to real progress', async () => {
    const entry = makeEntry('sermon-1', {
      durationMs: 3600000,
      lastPlayedAt: 100,
      positionMs: 3600000,
    })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await flushHistoryProgressAction(ctx, {
      durationMs: 3600000,
      positionMs: 2000000,
      sermon: mockAudio,
    })

    const atomState = ctx.get(historyAtom)
    expect(atomState[0].positionMs).toBe(2000000)
    expect(atomState[0].durationMs).toBe(3600000)
    // lastPlayedAt must not change — sort stability: immediate flush is a
    // progress statement, not a "played" event
    expect(atomState[0].lastPlayedAt).toBe(100)
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  test('deferred flush creates a missing entry (guard applies to existing entries only)', async () => {
    const ctx = createCtx()

    await flushHistoryProgressAction(ctx, {
      deferred: true,
      durationMs: 5000,
      playlist: mockPlaylist,
      positionMs: 2500,
      sermon: mockAudio,
    })

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(getEntrySermon(atomState[0])?.id).toBe('sermon-1')
    expect(atomState[0].positionMs).toBe(2500)
    expect(atomState[0].durationMs).toBe(5000)
  })

  test('create with durationMs 0 keeps entry.durationMs 0 (incomplete, self-heals on next flush)', async () => {
    const ctx = createCtx()

    // First flush with durationMs 0 — creates incomplete entry
    await flushHistoryProgressAction(ctx, {
      durationMs: 0,
      playlist: mockPlaylist,
      positionMs: 100,
      sermon: mockAudio,
    })

    const created = ctx.get(historyAtom)
    expect(created).toHaveLength(1)
    expect(created[0].durationMs).toBe(0)
    expect(created[0].positionMs).toBe(100)

    // Second flush with real durationMs — self-heals the entry
    await flushHistoryProgressAction(ctx, {
      durationMs: 5000,
      playlist: mockPlaylist,
      positionMs: 2500,
      sermon: mockAudio,
    })

    const updated = ctx.get(historyAtom)
    expect(updated[0].durationMs).toBe(5000)
    expect(updated[0].positionMs).toBe(2500)
  })

  test('updates incomplete entry normally (not blocked)', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 3600000, positionMs: 1000 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await flushHistoryProgressAction(ctx, {
      durationMs: 3600000,
      positionMs: 2000000,
      sermon: mockAudio,
    })

    expect(ctx.get(historyAtom)[0].positionMs).toBe(2000000)
    expect(clearSpy).toHaveBeenCalledTimes(1)
  })
})
