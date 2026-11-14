import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { SEARCH_HISTORY } from 'shared/config'
import { searchHistoryAtom } from '../model/searchHistoryAtom'
import { type SearchHistory, type SearchHistoryEntry } from '../model/types'
import { removeSearchEntryAction } from './removeSearchEntry'

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

describe('removeSearchEntryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  test('removes the entry by sermon id and persists the result', async () => {
    const ctx = createCtx()
    searchHistoryAtom(ctx, [makeEntry('a', 200), makeEntry('b', 100)])

    await removeSearchEntryAction(ctx, 'a')

    expect(ctx.get(searchHistoryAtom).map(entry => entry.sermon.id)).toEqual(['b'])
    expect((await readStored()).map(entry => entry.sermon.id)).toEqual(['b'])
  })

  test('leaves the list untouched for an unknown sermon id', async () => {
    const ctx = createCtx()
    searchHistoryAtom(ctx, [makeEntry('a', 200)])

    await removeSearchEntryAction(ctx, 'unknown')

    expect(ctx.get(searchHistoryAtom)).toHaveLength(1)
    expect(await AsyncStorage.getItem(SEARCH_HISTORY)).toBeNull()
  })
})
