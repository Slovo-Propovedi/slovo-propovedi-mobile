import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { writeHistory } from './historyStorage'
import { readProgressRecords, writeProgressRecords } from './progressStorage'
import { removeSermonsFromHistoryAction } from './removeSermonsFromHistory'

jest.mock('./historyStorage', () => ({
  writeHistory: jest.fn(),
}))

jest.mock('./liveProgressStorage', () => ({
  clearLiveProgressSnapshot: jest.fn(),
}))

const mockedWriteHistory = writeHistory as jest.MockedFunction<typeof writeHistory>

const AUDIO_URL = 'https://example.com/audio.mp3'

const makeEntry = (sermonId: string): ListeningHistoryEntry => ({
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
})

describe('removeSermonsFromHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('removes multiple ids in one write', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1'), makeEntry('sermon-2'), makeEntry('sermon-3')])

    await removeSermonsFromHistoryAction(ctx, ['sermon-1', 'sermon-3'])

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(getEntrySermon(atomState[0])?.id).toBe('sermon-2')
    expect(mockedWriteHistory).toHaveBeenCalledTimes(1)
    expect(mockedWriteHistory).toHaveBeenCalledWith(atomState)
  })

  test('unknown ids are a no-op with no write', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1')])

    await removeSermonsFromHistoryAction(ctx, ['does-not-exist'])

    expect(ctx.get(historyAtom)).toHaveLength(1)
    expect(mockedWriteHistory).not.toHaveBeenCalled()
  })

  test('empty array is a no-op with no write', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1')])

    await removeSermonsFromHistoryAction(ctx, [])

    expect(ctx.get(historyAtom)).toHaveLength(1)
    expect(mockedWriteHistory).not.toHaveBeenCalled()
  })

  test('removes progress records of the deleted sermons only', async () => {
    await AsyncStorage.clear()
    const record = { durationMs: 60_000, positionMs: 30_000, updatedAt: 1 }
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry('sermon-1'), makeEntry('sermon-2'), makeEntry('sermon-3')])
    await writeProgressRecords({ 'sermon-1': record, 'sermon-2': record, 'sermon-3': record })
    sermonProgressAtom(ctx, { 'sermon-1': record, 'sermon-2': record, 'sermon-3': record })

    await removeSermonsFromHistoryAction(ctx, ['sermon-1', 'sermon-3'])

    const progress = ctx.get(sermonProgressAtom)
    expect(progress['sermon-1']).toBeUndefined()
    expect(progress['sermon-3']).toBeUndefined()
    // Оставшаяся запись каталога перезаписывает свою progress-запись коммитом.
    expect(progress['sermon-2']?.positionMs).toBe(500)
    const stored = await readProgressRecords()
    expect(stored['sermon-1']).toBeUndefined()
    expect(stored['sermon-3']).toBeUndefined()
    expect(stored['sermon-2']?.positionMs).toBe(500)
  })
})
