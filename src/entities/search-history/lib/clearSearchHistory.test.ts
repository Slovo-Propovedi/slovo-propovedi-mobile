import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { SEARCH_HISTORY } from 'shared/config'
import { searchHistoryAtom } from '../model/searchHistoryAtom'
import { type SearchHistory, type SearchHistoryEntry } from '../model/types'
import { clearSearchHistoryAction } from './clearSearchHistory'

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

describe('clearSearchHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  test('empties the atom and storage', async () => {
    const ctx = createCtx()
    searchHistoryAtom(ctx, [makeEntry('a', 100)])

    await clearSearchHistoryAction(ctx)

    expect(ctx.get(searchHistoryAtom)).toEqual([])

    const stored: SearchHistory = JSON.parse((await AsyncStorage.getItem(SEARCH_HISTORY)) ?? '[]')
    expect(stored).toEqual([])
  })
})
