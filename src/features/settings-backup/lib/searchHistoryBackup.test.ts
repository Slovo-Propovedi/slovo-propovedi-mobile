import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import {
  type SearchHistory,
  searchHistoryAtom,
  type SearchHistoryEntry,
} from 'entities/search-history'
import { SEARCH_HISTORY } from 'shared/config'
import { applyImport } from './applyImport'
import { buildPayload } from './buildPayload'

// backupPayload тянет entities/player, а тот — нативный expo-audio.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

const makeEntry = (sermonId: string, savedAt: number): SearchHistoryEntry => ({
  savedAt,
  sermon: {
    artist: 'Author',
    artwork: 'sermon.jpg',
    audioUrl: 'https://example.com/audio.mp3',
    id: sermonId,
    title: `Sermon ${sermonId}`,
  },
})

const readStored = async (): Promise<SearchHistory> =>
  JSON.parse((await AsyncStorage.getItem(SEARCH_HISTORY)) ?? '[]')

const sermonIds = (history: SearchHistory): string[] => history.map(entry => entry.sermon.id)

describe('search history backup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  test('buildPayload exports the stored search history', async () => {
    const stored: SearchHistory = [makeEntry('a', 200), makeEntry('b', 100)]
    await AsyncStorage.setItem(SEARCH_HISTORY, JSON.stringify(stored))

    const payload = await buildPayload()

    expect(payload.data.searchHistory).toEqual(stored)
  })

  test('replace writes the imported section as is', async () => {
    await AsyncStorage.setItem(SEARCH_HISTORY, JSON.stringify([makeEntry('local', 100)]))
    const imported: SearchHistory = [makeEntry('imported', 500)]

    const ctx = createCtx()
    await applyImport(ctx, { searchHistory: imported }, 'replace')

    expect(ctx.get(searchHistoryAtom)).toEqual(imported)
    expect(await readStored()).toEqual(imported)
  })

  test('merge keeps local entries and the newest copy of duplicates', async () => {
    await AsyncStorage.setItem(
      SEARCH_HISTORY,
      JSON.stringify([makeEntry('shared', 100), makeEntry('local', 200)]),
    )
    const imported: SearchHistory = [makeEntry('shared', 400), makeEntry('imported', 300)]

    const ctx = createCtx()
    await applyImport(ctx, { searchHistory: imported }, 'merge')

    expect(sermonIds(ctx.get(searchHistoryAtom))).toEqual(['shared', 'imported', 'local'])
    expect(ctx.get(searchHistoryAtom)[0].savedAt).toBe(400)
  })

  test('a backup without the section leaves local search history untouched', async () => {
    const local: SearchHistory = [makeEntry('local', 100)]
    await AsyncStorage.setItem(SEARCH_HISTORY, JSON.stringify(local))

    const ctx = createCtx()
    await applyImport(ctx, {}, 'replace')

    expect(await readStored()).toEqual(local)
    expect(ctx.get(searchHistoryAtom)).toEqual([])
  })
})
