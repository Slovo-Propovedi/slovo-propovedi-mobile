import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { LISTENING_HISTORY } from 'shared/config'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { clearHistoryAction } from './clearHistory'
import { readProgressRecords, writeProgressRecords } from './progressStorage'

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

describe('clearHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

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

  test('clears progress records in storage and atom', async () => {
    const record = { durationMs: 60_000, positionMs: 30_000, updatedAt: 1 }
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1')])
    await writeProgressRecords({ 'sermon-1': record, 'sermon-2': record })
    sermonProgressAtom(ctx, { 'sermon-1': record, 'sermon-2': record })

    await clearHistoryAction(ctx)

    expect(ctx.get(sermonProgressAtom)).toEqual({})
    expect(await readProgressRecords()).toEqual({})
  })
})
