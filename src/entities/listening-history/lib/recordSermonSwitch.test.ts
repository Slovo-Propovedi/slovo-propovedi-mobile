import { createCtx } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { historyAtom } from '../model/history'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'
import { recordSermonSwitchAction } from './recordSermonSwitch'

jest.mock('./historyStorage', () => ({
  writeHistory: jest.fn(),
}))

jest.mock('./liveProgressStorage', () => ({
  clearLiveProgressSnapshot: jest.fn(),
}))

const AUDIO_URL = 'https://example.com/audio.mp3'
const OLD_SERMON_ID = 'sermon-old'

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

const findEntry = (ctx: ReturnType<typeof createCtx>, sermonId: string) =>
  ctx.get(historyAtom).find(e => getEntrySermon(e)?.id === sermonId)

describe('recordSermonSwitchAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('markOldCompleted with zero-duration old entry uses live duration and completes it', async () => {
    const oldEntry = makeEntry(OLD_SERMON_ID, { durationMs: 0, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [oldEntry])

    await recordSermonSwitchAction(ctx, {
      markOldCompleted: true,
      newAudio: mockAudio,
      newPlaylist: mockPlaylist,
      oldDurationMs: 3_600_000,
      oldPositionMs: 500,
      oldSermonId: OLD_SERMON_ID,
    })

    const flushedOld = findEntry(ctx, OLD_SERMON_ID)
    expect(flushedOld?.durationMs).toBe(3_600_000)
    expect(flushedOld?.positionMs).toBe(3_600_000)
    expect(flushedOld && isEntryCompleted(flushedOld)).toBe(true)
  })

  test('markOldCompleted prefers live duration, falls back to entry duration', async () => {
    const oldEntry = makeEntry(OLD_SERMON_ID, { durationMs: 1000, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [oldEntry])

    await recordSermonSwitchAction(ctx, {
      markOldCompleted: true,
      newAudio: mockAudio,
      newPlaylist: mockPlaylist,
      oldDurationMs: 3_600_000,
      oldPositionMs: 500,
      oldSermonId: OLD_SERMON_ID,
    })

    const flushedOld = findEntry(ctx, OLD_SERMON_ID)
    expect(flushedOld?.durationMs).toBe(3_600_000)
    expect(flushedOld?.positionMs).toBe(3_600_000)

    const ctxFallback = createCtx()
    historyAtom(ctxFallback, [oldEntry])

    await recordSermonSwitchAction(ctxFallback, {
      markOldCompleted: true,
      newAudio: mockAudio,
      newPlaylist: mockPlaylist,
      oldDurationMs: 0,
      oldPositionMs: 500,
      oldSermonId: OLD_SERMON_ID,
    })

    const fallbackOld = findEntry(ctxFallback, OLD_SERMON_ID)
    expect(fallbackOld?.durationMs).toBe(1000)
    expect(fallbackOld?.positionMs).toBe(1000)
  })

  test('markOldCompleted with unknown duration keeps oldPositionMs instead of zeroing', async () => {
    const oldEntry = makeEntry(OLD_SERMON_ID, { durationMs: 0, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [oldEntry])

    await recordSermonSwitchAction(ctx, {
      markOldCompleted: true,
      newAudio: mockAudio,
      newPlaylist: mockPlaylist,
      oldDurationMs: 0,
      oldPositionMs: 500,
      oldSermonId: OLD_SERMON_ID,
    })

    const flushedOld = findEntry(ctx, OLD_SERMON_ID)
    expect(flushedOld?.durationMs).toBe(0)
    expect(flushedOld?.positionMs).toBe(500)
    expect(flushedOld && isEntryCompleted(flushedOld)).toBe(false)
  })

  test('manual switch keeps oldPositionMs and updates duration to live value', async () => {
    const oldEntry = makeEntry(OLD_SERMON_ID, { durationMs: 0, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [oldEntry])

    await recordSermonSwitchAction(ctx, {
      markOldCompleted: false,
      newAudio: mockAudio,
      newPlaylist: mockPlaylist,
      oldDurationMs: 3_600_000,
      oldPositionMs: 700,
      oldSermonId: OLD_SERMON_ID,
    })

    const flushedOld = findEntry(ctx, OLD_SERMON_ID)
    expect(flushedOld?.durationMs).toBe(3_600_000)
    expect(flushedOld?.positionMs).toBe(700)
  })

  test('new sermon not in history is created at top, old flushed', async () => {
    const oldEntry = makeEntry(OLD_SERMON_ID, { durationMs: 0, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [oldEntry])

    await recordSermonSwitchAction(ctx, {
      markOldCompleted: false,
      newAudio: mockAudio,
      newPlaylist: mockPlaylist,
      oldDurationMs: 3_600_000,
      oldPositionMs: 500,
      oldSermonId: OLD_SERMON_ID,
    })

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(2)
    expect(getEntrySermon(atomState[0])?.id).toBe('sermon-1')
    expect(atomState[0].positionMs).toBe(0)
    expect(atomState[0].durationMs).toBe(0)
    expect(getEntrySermon(atomState[1])?.id).toBe(OLD_SERMON_ID)
  })

  test('existing completed new sermon is reset to fresh entry', async () => {
    const oldEntry = makeEntry(OLD_SERMON_ID, { durationMs: 0, positionMs: 500 })
    const completedNew = makeEntry('sermon-1', {
      durationMs: 3_600_000,
      lastPlayedAt: 100,
      positionMs: 3_595_000,
    })
    const ctx = createCtx()
    historyAtom(ctx, [oldEntry, completedNew])

    await recordSermonSwitchAction(ctx, {
      markOldCompleted: false,
      newAudio: mockAudio,
      newPlaylist: mockPlaylist,
      oldDurationMs: 3_600_000,
      oldPositionMs: 500,
      oldSermonId: OLD_SERMON_ID,
    })

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(2)
    const newEntry = findEntry(ctx, 'sermon-1')
    expect(newEntry?.positionMs).toBe(0)
    expect(newEntry?.durationMs).toBe(0)
    expect(newEntry?.lastPlayedAt).toBeGreaterThan(100)
  })
})
