import { createCtx } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/sermon/@x/listening-history'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { MANUAL_LISTENED_DURATION_MS } from './constants'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'
import { markHistoryCompletedAction } from './markHistoryCompleted'

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

const sermonSnapshot: AudioPlayerData = {
  artist: 'Author',
  artwork: 'sermon.jpg',
  audioUrl: 'https://example.com/track-2.mp3',
  id: 'sermon-2',
  title: 'Sermon 2',
}

describe('markHistoryCompletedAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('sets positionMs equal to durationMs', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await markHistoryCompletedAction(ctx, 'sermon-1')

    expect(ctx.get(historyAtom)[0].positionMs).toBe(1000)
  })

  test('uses live durationMs when provided and greater than 0', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 0, positionMs: 0 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await markHistoryCompletedAction(ctx, 'sermon-1', 3_600_000)

    const updated = ctx.get(historyAtom)[0]
    expect(updated.durationMs).toBe(3_600_000)
    expect(updated.positionMs).toBe(3_600_000)
  })

  test('completes a zero-duration entry with the manual duration', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 0, positionMs: 0 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await markHistoryCompletedAction(ctx, 'sermon-1')

    const updated = ctx.get(historyAtom)[0]
    expect(updated.durationMs).toBe(MANUAL_LISTENED_DURATION_MS)
    expect(updated.positionMs).toBe(MANUAL_LISTENED_DURATION_MS)
    expect(isEntryCompleted(updated)).toBe(true)
  })

  test('no-op when entry is missing and no sermon snapshot is provided', async () => {
    const entry = makeEntry('sermon-1')
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await markHistoryCompletedAction(ctx, 'unknown')

    expect(ctx.get(historyAtom)).toEqual([entry])
  })

  test('creates a completed entry from the sermon snapshot when entry is missing', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [])

    await markHistoryCompletedAction(ctx, sermonSnapshot.id, undefined, sermonSnapshot)

    const created = ctx.get(historyAtom)[0]
    expect(getEntrySermon(created)?.id).toBe(sermonSnapshot.id)
    expect(created.durationMs).toBe(MANUAL_LISTENED_DURATION_MS)
    expect(isEntryCompleted(created)).toBe(true)
  })

  test('created missing entry keeps the live duration when provided', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [])

    await markHistoryCompletedAction(ctx, sermonSnapshot.id, 120_000, sermonSnapshot)

    const created = ctx.get(historyAtom)[0]
    expect(created.durationMs).toBe(120_000)
    expect(created.positionMs).toBe(120_000)
    expect(isEntryCompleted(created)).toBe(true)
  })
})
