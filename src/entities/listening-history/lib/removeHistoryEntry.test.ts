import { createCtx } from '@reatom/framework'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { removeHistoryEntryAction } from './removeHistoryEntry'

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

describe('removeHistoryEntryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('removes entry by sermon id', async () => {
    const e1 = makeEntry('sermon-1')
    const e2 = makeEntry('sermon-2')
    const ctx = createCtx()
    historyAtom(ctx, [e1, e2])

    await removeHistoryEntryAction(ctx, 'sermon-1')

    expect(ctx.get(historyAtom)).toHaveLength(1)
    expect(getEntrySermon(ctx.get(historyAtom)[0])?.id).toBe('sermon-2')
  })

  test('no-op when sermon id not found', async () => {
    const entry = makeEntry('sermon-1')
    const ctx = createCtx()
    historyAtom(ctx, [entry])

    await removeHistoryEntryAction(ctx, 'unknown')

    expect(ctx.get(historyAtom)).toHaveLength(1)
  })
})
