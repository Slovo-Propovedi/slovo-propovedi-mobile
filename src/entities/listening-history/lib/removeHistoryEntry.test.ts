import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { readProgressRecords, writeProgressRecords } from './progressStorage'
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

  test('removes the progress record of the deleted sermon', async () => {
    await AsyncStorage.clear()
    const record = { durationMs: 60_000, positionMs: 30_000, updatedAt: 1 }
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1'), makeEntry('sermon-2')])
    await writeProgressRecords({ 'sermon-1': record, 'sermon-2': record })
    sermonProgressAtom(ctx, { 'sermon-1': record, 'sermon-2': record })

    await removeHistoryEntryAction(ctx, 'sermon-1')

    const progress = ctx.get(sermonProgressAtom)
    expect(progress['sermon-1']).toBeUndefined()
    // Оставшаяся запись каталога перезаписывает свою progress-запись коммитом.
    expect(progress['sermon-2']?.positionMs).toBe(500)
    const stored = await readProgressRecords()
    expect(stored['sermon-1']).toBeUndefined()
    expect(stored['sermon-2']?.positionMs).toBe(500)
  })
})
