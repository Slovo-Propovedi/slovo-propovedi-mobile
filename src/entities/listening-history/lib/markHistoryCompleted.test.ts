import { createCtx } from '@reatom/framework'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
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

  test('no-op when entry missing', async () => {
    const entry = makeEntry('sermon-1')
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await markHistoryCompletedAction(ctx, 'unknown')

    expect(ctx.get(historyAtom)).toEqual([entry])
  })

  test('no-op when durationMs is 0 and no live duration provided', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 0, positionMs: 0 })
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await markHistoryCompletedAction(ctx, 'sermon-1')

    expect(ctx.get(historyAtom)[0].positionMs).toBe(0)
  })
})
