import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { SEARCH_HISTORY } from 'shared/config'
import { MAX_SEARCH_HISTORY_ENTRIES } from '../model/constants'
import { searchHistoryAtom } from '../model/searchHistoryAtom'
import { type SearchHistory, type SearchHistoryEntry } from '../model/types'
import { addSearchEntryAction } from './addSearchEntry'

const makeSermon = (sermonId: string): SearchHistoryEntry['sermon'] => ({
  artist: 'Author',
  artwork: 'sermon.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: sermonId,
  title: `Sermon ${sermonId}`,
})

const makeEntry = (sermonId: string, savedAt: number): SearchHistoryEntry => ({
  savedAt,
  sermon: makeSermon(sermonId),
})

const readStored = async (): Promise<SearchHistory> =>
  JSON.parse((await AsyncStorage.getItem(SEARCH_HISTORY)) ?? '[]')

describe('addSearchEntryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('prepends a new entry stamped with the current time', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(500)
    const ctx = createCtx()
    searchHistoryAtom(ctx, [makeEntry('old', 100)])

    await addSearchEntryAction(ctx, makeSermon('new'))

    expect(ctx.get(searchHistoryAtom)).toEqual([makeEntry('new', 500), makeEntry('old', 100)])
  })

  test('re-adding a sermon moves it to the top with a fresh timestamp', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(900)
    const ctx = createCtx()
    searchHistoryAtom(ctx, [makeEntry('a', 300), makeEntry('b', 200)])

    await addSearchEntryAction(ctx, makeSermon('b'))

    const ids = ctx.get(searchHistoryAtom).map(entry => entry.sermon.id)
    expect(ids).toEqual(['b', 'a'])
    expect(ctx.get(searchHistoryAtom)[0].savedAt).toBe(900)
  })

  test('persists the committed list to storage', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(700)
    const ctx = createCtx()

    await addSearchEntryAction(ctx, makeSermon('a'))
    await addSearchEntryAction(ctx, makeSermon('b'))

    expect((await readStored()).map(entry => entry.sermon.id)).toEqual(['b', 'a'])
  })

  test('caps the list at the entry limit', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000)
    const ctx = createCtx()
    searchHistoryAtom(
      ctx,
      Array.from({ length: MAX_SEARCH_HISTORY_ENTRIES }, (_, i) => makeEntry(`s-${i}`, i)),
    )

    await addSearchEntryAction(ctx, makeSermon('newest'))

    expect(ctx.get(searchHistoryAtom)).toHaveLength(MAX_SEARCH_HISTORY_ENTRIES)
    expect(ctx.get(searchHistoryAtom)[0].sermon.id).toBe('newest')
  })
})
