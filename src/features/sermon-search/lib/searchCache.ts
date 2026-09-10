import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { CACHED_SERMON_SEARCH, CACHED_SERMON_SEARCH_INDEX } from 'shared/config'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { getParseJsonWithSchema, type SermonData, sermonSchema } from 'shared/model'

export const MAX_CACHED_SEARCH_QUERIES = 30

const sermonsArraySchema = z.array(sermonSchema)
const queryIndexSchema = z.array(z.string())

const SEARCH_CACHE_DATA_PREFIX = `${CACHED_SERMON_SEARCH}:`

let searchCacheWriteQueue: Promise<void> = Promise.resolve()

const parseSearchIndex = getParseJsonWithSchema(queryIndexSchema)

const cleanOrphanedSearchCacheKeys = async (excludeKey?: string): Promise<void> => {
  const allKeys = await AsyncStorage.getAllKeys()
  const orphanedKeys = allKeys.filter(
    key =>
      key.startsWith(SEARCH_CACHE_DATA_PREFIX) &&
      key !== CACHED_SERMON_SEARCH_INDEX &&
      key !== excludeKey,
  )
  if (orphanedKeys.length === 0) return
  await AsyncStorage.multiRemove(orphanedKeys)
}

const updateSearchCacheIndex = async (latestKey: string): Promise<void> => {
  const rawIndex = await AsyncStorage.getItem(CACHED_SERMON_SEARCH_INDEX)
  const parsedIndex = parseSearchIndex(rawIndex)

  if (rawIndex !== null && parsedIndex === undefined) {
    let cleanupSucceeded = true
    await cleanOrphanedSearchCacheKeys(latestKey).catch(error => {
      console.warn('Failed to clean orphaned search cache keys:', error)
      cleanupSucceeded = false
    })
    if (cleanupSucceeded) await setCachedJson(CACHED_SERMON_SEARCH_INDEX, [latestKey])
    return
  }

  const index = parsedIndex ?? []
  const withoutLatest = index.filter(entry => entry !== latestKey)
  const nextIndex = [...withoutLatest, latestKey]

  if (nextIndex.length > MAX_CACHED_SEARCH_QUERIES) {
    const overflowCount = nextIndex.length - MAX_CACHED_SEARCH_QUERIES
    await AsyncStorage.multiRemove(nextIndex.slice(0, overflowCount))
  }

  await setCachedJson(CACHED_SERMON_SEARCH_INDEX, nextIndex.slice(-MAX_CACHED_SEARCH_QUERIES))
}

const writeSearchCacheEntry = async (key: string, sermons: SermonData[]): Promise<void> => {
  await setCachedJson(key, sermons)
  await updateSearchCacheIndex(key)
}

const enqueueSearchCacheWrite = (key: string, sermons: SermonData[]): Promise<void> => {
  searchCacheWriteQueue = searchCacheWriteQueue
    .then(() => writeSearchCacheEntry(key, sermons))
    .catch(error => {
      console.error('Search cache write failed:', error)
    })

  return searchCacheWriteQueue
}

export const getSearchCacheKey = (query: string): string =>
  `${CACHED_SERMON_SEARCH}:${query.trim().toLowerCase()}`

export const getCachedSearchResults = async (query: string): Promise<SermonData[] | undefined> =>
  getCachedJson(getSearchCacheKey(query), sermonsArraySchema)

/**
 * Persists search results for a query.
 * Never rejects: failures are caught and logged inside the write queue;
 * callers' `.catch` is a safety net only.
 * @param query - Normalized search query (trimmed, lowercased).
 * @param sermons - Results to cache; empty arrays are skipped.
 */
export const setCachedSearchResults = async (
  query: string,
  sermons: SermonData[],
): Promise<void> => {
  if (sermons.length === 0) return

  const key = getSearchCacheKey(query)

  await enqueueSearchCacheWrite(key, sermons)
}
