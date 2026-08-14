import AsyncStorage from '@react-native-async-storage/async-storage'
import { CACHED_SERMON_SEARCH_INDEX } from 'shared/config'
import type { SermonData } from 'shared/model'
import {
  getCachedSearchResults,
  getSearchCacheKey,
  MAX_CACHED_SEARCH_QUERIES,
  setCachedSearchResults,
} from './searchCache'

const sermon: SermonData = {
  artist: 'Иван',
  artwork: 'https://example.com/a.jpg',
  audioUrl: 'https://example.com/a.mp3',
  id: '1',
  title: 'Проповедь о вере',
}

describe('searchCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  describe('getSearchCacheKey', () => {
    test('normalizes the query with trim and lowercase', () => {
      expect(getSearchCacheKey('  ВеРА ')).toBe('cachedSermonSearch:вера')
    })
  })

  describe('getCachedSearchResults', () => {
    test('returns undefined when nothing is cached for the query', async () => {
      const result = await getCachedSearchResults('вера')

      expect(result).toBeUndefined()
    })

    test('returns cached sermons written for the same normalized query', async () => {
      await setCachedSearchResults('  ВеРА ', [sermon])

      const result = await getCachedSearchResults('вера')

      expect(result).toEqual([sermon])
    })
  })

  describe('setCachedSearchResults', () => {
    test('writes sermons under the normalized query key', async () => {
      const setItemSpy = jest.spyOn(AsyncStorage, 'setItem')

      await setCachedSearchResults('  ВеРА ', [sermon])

      expect(setItemSpy).toHaveBeenCalledWith('cachedSermonSearch:вера', JSON.stringify([sermon]))
    })

    test('does not cache an empty result array', async () => {
      const setItemSpy = jest.spyOn(AsyncStorage, 'setItem')

      await setCachedSearchResults('вера', [])

      expect(setItemSpy).not.toHaveBeenCalledWith('cachedSermonSearch:вера', expect.any(String))
    })
  })

  describe('cache index cap', () => {
    test('tracks recent query keys in the index', async () => {
      await setCachedSearchResults('запрос-1', [sermon])

      const index = JSON.parse((await AsyncStorage.getItem(CACHED_SERMON_SEARCH_INDEX)) ?? '[]')

      expect(index).toEqual(['cachedSermonSearch:запрос-1'])
    })

    test('keeps only the newest queries and removes the oldest via multiRemove', async () => {
      for (let i = 1; i <= MAX_CACHED_SEARCH_QUERIES + 3; i++)
        await setCachedSearchResults(`запрос-${i}`, [sermon])

      const index = JSON.parse((await AsyncStorage.getItem(CACHED_SERMON_SEARCH_INDEX)) ?? '[]')

      expect(index).toHaveLength(MAX_CACHED_SEARCH_QUERIES)
      expect(index[0]).toBe('cachedSermonSearch:запрос-4')
      expect(index[index.length - 1]).toBe(
        `cachedSermonSearch:запрос-${MAX_CACHED_SEARCH_QUERIES + 3}`,
      )
      expect(await AsyncStorage.getItem('cachedSermonSearch:запрос-1')).toBeNull()
      expect(await AsyncStorage.getItem('cachedSermonSearch:запрос-2')).toBeNull()
      expect(await AsyncStorage.getItem('cachedSermonSearch:запрос-3')).toBeNull()
      expect(await AsyncStorage.getItem('cachedSermonSearch:запрос-4')).not.toBeNull()
      expect(
        await AsyncStorage.getItem(`cachedSermonSearch:запрос-${MAX_CACHED_SEARCH_QUERIES + 3}`),
      ).not.toBeNull()
    })

    test('removes the oldest query keys via multiRemove', async () => {
      const multiRemoveSpy = jest.spyOn(AsyncStorage, 'multiRemove')

      for (let i = 1; i <= MAX_CACHED_SEARCH_QUERIES + 2; i++)
        await setCachedSearchResults(`запрос-${i}`, [sermon])

      expect(multiRemoveSpy).toHaveBeenNthCalledWith(1, ['cachedSermonSearch:запрос-1'])
      expect(multiRemoveSpy).toHaveBeenNthCalledWith(2, ['cachedSermonSearch:запрос-2'])
    })

    test('moves an existing query to the end of the index without duplicating it', async () => {
      await setCachedSearchResults('запрос-1', [sermon])
      await setCachedSearchResults('запрос-2', [sermon])
      await setCachedSearchResults('запрос-1', [sermon])

      const index = JSON.parse((await AsyncStorage.getItem(CACHED_SERMON_SEARCH_INDEX)) ?? '[]')

      expect(index).toEqual(['cachedSermonSearch:запрос-2', 'cachedSermonSearch:запрос-1'])
    })
  })

  describe('concurrent index updates', () => {
    test('serializes overlapping writes so both query keys stay in the index', async () => {
      await Promise.all([
        setCachedSearchResults('запрос-1', [sermon]),
        setCachedSearchResults('запрос-2', [sermon]),
      ])

      const index = JSON.parse((await AsyncStorage.getItem(CACHED_SERMON_SEARCH_INDEX)) ?? '[]')

      expect(index).toEqual(
        expect.arrayContaining(['cachedSermonSearch:запрос-1', 'cachedSermonSearch:запрос-2']),
      )
      expect(index).toHaveLength(2)
    })
  })
})
