import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { SEARCH_HISTORY } from 'shared/config'
import { isSearchHistoryLoadedAtom, searchHistoryAtom } from '../model/searchHistoryAtom'
import { type SearchHistory, type SearchHistoryEntry } from '../model/types'
import { loadSearchHistoryAction } from './loadSearchHistory'

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

describe('loadSearchHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  test('loads entries from storage and sets atom', async () => {
    const data: SearchHistory = [makeEntry('sermon-1', 100)]
    await AsyncStorage.setItem(SEARCH_HISTORY, JSON.stringify(data))

    const ctx = createCtx()
    await loadSearchHistoryAction(ctx)

    expect(ctx.get(searchHistoryAtom)).toEqual(data)
  })

  test('replaces a corrupt stored value with an empty list', async () => {
    await AsyncStorage.setItem(SEARCH_HISTORY, '{not-json')

    const ctx = createCtx()
    await loadSearchHistoryAction(ctx)

    expect(ctx.get(searchHistoryAtom)).toEqual([])
  })

  test('marks search history as loaded after hydration', async () => {
    const ctx = createCtx()
    expect(ctx.get(isSearchHistoryLoadedAtom)).toBe(false)

    await loadSearchHistoryAction(ctx)

    expect(ctx.get(isSearchHistoryLoadedAtom)).toBe(true)
  })

  test('treats disk as authoritative after the first hydration', async () => {
    await AsyncStorage.setItem(SEARCH_HISTORY, JSON.stringify([makeEntry('disk', 100)]))

    const ctx = createCtx()
    searchHistoryAtom(ctx, [makeEntry('memory', 200)])
    await loadSearchHistoryAction(ctx)
    await loadSearchHistoryAction(ctx)

    expect(ctx.get(searchHistoryAtom).map(entry => entry.sermon.id)).toEqual(['disk'])
  })
})
