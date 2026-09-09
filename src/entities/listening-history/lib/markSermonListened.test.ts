import { createCtx } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { MANUAL_LISTENED_DURATION_MS, MAX_HISTORY_ENTRIES } from './constants'
import { getEntrySermon } from './getEntrySermon'
import { writeHistory } from './historyStorage'
import { isEntryCompleted } from './isEntryCompleted'
import { markSermonListenedAction } from './markSermonListened'

jest.mock('./historyStorage', () => ({
  writeHistory: jest.fn(),
}))

jest.mock('./liveProgressStorage', () => ({
  clearLiveProgressSnapshot: jest.fn(),
}))

const mockedWriteHistory = writeHistory as jest.MockedFunction<typeof writeHistory>

const AUDIO_URL = 'https://example.com/audio.mp3'

const mockAudio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'sermon.jpg',
  audioUrl: AUDIO_URL,
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
        audioUrl: AUDIO_URL,
        id: sermonId,
        title: `Sermon ${sermonId}`,
      },
    ],
    title: 'Playlist',
  },
  positionMs: 500,
  ...overrides,
})

describe('markSermonListenedAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('creates completed entry for unplayed sermon using provided playlist', async () => {
    const ctx = createCtx()

    await markSermonListenedAction(ctx, mockAudio, mockPlaylist)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    const entry = atomState[0]
    expect(entry.durationMs).toBe(MANUAL_LISTENED_DURATION_MS)
    expect(entry.positionMs).toBe(MANUAL_LISTENED_DURATION_MS)
    expect(entry.lastPlayedAt).toBeGreaterThan(Date.now() - 5000)
    expect(entry.playlist.sermons[0].id).toBe('sermon-1')
    expect(entry.playlist.id).toBe('pl-1')
    expect(entry.playlist.title).toBe('Test Playlist')
    expect(isEntryCompleted(entry)).toBe(true)
  })

  test('builds synthetic single-sermon playlist when playlist omitted', async () => {
    const ctx = createCtx()

    await markSermonListenedAction(ctx, mockAudio)

    const entry = ctx.get(historyAtom)[0]
    expect(entry.playlist.id).toBe('sermon-1')
    expect(entry.playlist.title).toBe('Test Sermon')
    expect(entry.playlist.artwork).toBe(mockAudio.artwork)
    expect(entry.playlist.description).toBe('')
    expect(entry.playlist.sermons).toHaveLength(1)
    expect(entry.playlist.sermons[0].id).toBe('sermon-1')
    expect(entry.playlist.sermons[0]).not.toHaveProperty('playlists')
  })

  test('completes partial entry keeping lastPlayedAt and list position', async () => {
    const lastPlayedAt = 1000
    const partial = makeEntry('sermon-1', { durationMs: 1000, lastPlayedAt, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [partial])

    await markSermonListenedAction(ctx, mockAudio)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(atomState[0].durationMs).toBe(1000)
    expect(atomState[0].positionMs).toBe(1000)
    expect(atomState[0].lastPlayedAt).toBe(lastPlayedAt)
    expect(isEntryCompleted(atomState[0])).toBe(true)
  })

  test('entry with zero duration gets MANUAL duration and completes', async () => {
    const zeroDuration = makeEntry('sermon-1', { durationMs: 0, positionMs: 0 })
    const ctx = createCtx()
    historyAtom(ctx, [zeroDuration])

    await markSermonListenedAction(ctx, mockAudio)

    const entry = ctx.get(historyAtom)[0]
    expect(entry.durationMs).toBe(MANUAL_LISTENED_DURATION_MS)
    expect(entry.positionMs).toBe(MANUAL_LISTENED_DURATION_MS)
    expect(isEntryCompleted(entry)).toBe(true)
  })

  test('idempotent on already-completed entry', async () => {
    const completed = makeEntry('sermon-1', {
      durationMs: 1000,
      lastPlayedAt: 500,
      positionMs: 1000,
    })
    const ctx = createCtx()
    historyAtom(ctx, [completed])

    await markSermonListenedAction(ctx, mockAudio)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(atomState[0].durationMs).toBe(1000)
    expect(atomState[0].positionMs).toBe(1000)
    expect(atomState[0].lastPlayedAt).toBe(500)
  })

  test('persists result via writeHistory', async () => {
    const ctx = createCtx()

    await markSermonListenedAction(ctx, mockAudio)

    const atomState = ctx.get(historyAtom)
    expect(mockedWriteHistory).toHaveBeenCalledTimes(1)
    expect(mockedWriteHistory).toHaveBeenCalledWith(atomState)
  })

  test('evicts the oldest entry when history is at the cap', async () => {
    const ctx = createCtx()
    const entries = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) =>
      makeEntry(`sermon-${i}`, { lastPlayedAt: i }),
    )
    historyAtom(ctx, entries)
    const freshAudio: AudioPlayerData = { ...mockAudio, id: 'fresh-sermon' }

    await markSermonListenedAction(ctx, freshAudio)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(MAX_HISTORY_ENTRIES)
    expect(atomState.some(e => getEntrySermon(e)?.id === 'fresh-sermon')).toBe(true)
    expect(atomState.some(e => getEntrySermon(e)?.id === 'sermon-0')).toBe(false)
  })
})
