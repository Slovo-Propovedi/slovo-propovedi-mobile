import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { CACHED_SERMON_SEARCH, CACHED_SERMON_SEARCH_INDEX } from 'shared/config'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { type SermonData, sermonSchema } from 'shared/model'

export const MAX_CACHED_SEARCH_QUERIES = 30

const sermonsArraySchema = z.array(sermonSchema)
const queryIndexSchema = z.array(z.string())

let indexWriteQueue: Promise<void> = Promise.resolve()

const updateSearchCacheIndex = async (latestKey: string): Promise<void> => {
  const index = (await getCachedJson(CACHED_SERMON_SEARCH_INDEX, queryIndexSchema)) ?? []
  const withoutLatest = index.filter(entry => entry !== latestKey)
  const nextIndex = [...withoutLatest, latestKey]

  if (nextIndex.length > MAX_CACHED_SEARCH_QUERIES) {
    const overflowCount = nextIndex.length - MAX_CACHED_SEARCH_QUERIES
    await AsyncStorage.multiRemove(nextIndex.slice(0, overflowCount))
  }

  await setCachedJson(CACHED_SERMON_SEARCH_INDEX, nextIndex.slice(-MAX_CACHED_SEARCH_QUERIES))
}

const enqueueIndexWrite = (latestKey: string): Promise<void> => {
  indexWriteQueue = indexWriteQueue
    .then(() => updateSearchCacheIndex(latestKey))
    .catch(error => {
      console.error('Search cache index write failed:', error)
    })

  return indexWriteQueue
}

export const getSearchCacheKey = (query: string): string =>
  `${CACHED_SERMON_SEARCH}:${query.trim().toLowerCase()}`

export const getCachedSearchResults = async (query: string): Promise<SermonData[] | undefined> =>
  getCachedJson(getSearchCacheKey(query), sermonsArraySchema)

export const setCachedSearchResults = async (
  query: string,
  sermons: SermonData[],
): Promise<void> => {
  if (sermons.length === 0) return

  const key = getSearchCacheKey(query)

  await setCachedJson(key, sermons)
  await enqueueIndexWrite(key)
}
