import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { type PlaylistData, playlistDataSchema } from 'entities/playlist'
import { CACHED_PLAYLIST_SEARCH, CACHED_PLAYLIST_SEARCH_INDEX } from 'shared/config'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { getParseJsonWithSchema } from 'shared/model'

const MAX_CACHED_SEARCH_QUERIES = 30

const playlistsArraySchema = z.array(playlistDataSchema)
const queryIndexSchema = z.array(z.string())

const SEARCH_CACHE_DATA_PREFIX = `${CACHED_PLAYLIST_SEARCH}:`

let searchCacheWriteQueue: Promise<void> = Promise.resolve()

const parseSearchIndex = getParseJsonWithSchema(queryIndexSchema)

const cleanOrphanedSearchCacheKeys = async (excludeKey?: string): Promise<void> => {
  const allKeys = await AsyncStorage.getAllKeys()
  const orphanedKeys = allKeys.filter(
    key =>
      key.startsWith(SEARCH_CACHE_DATA_PREFIX) &&
      key !== CACHED_PLAYLIST_SEARCH_INDEX &&
      key !== excludeKey,
  )
  if (orphanedKeys.length === 0) return
  await AsyncStorage.multiRemove(orphanedKeys)
}

const updateSearchCacheIndex = async (latestKey: string): Promise<void> => {
  const rawIndex = await AsyncStorage.getItem(CACHED_PLAYLIST_SEARCH_INDEX)
  const parsedIndex = parseSearchIndex(rawIndex)

  if (rawIndex !== null && parsedIndex === undefined) {
    let cleanupSucceeded = true
    await cleanOrphanedSearchCacheKeys(latestKey).catch(error => {
      console.warn('Failed to clean orphaned playlist search cache keys:', error)
      cleanupSucceeded = false
    })
    if (cleanupSucceeded) await setCachedJson(CACHED_PLAYLIST_SEARCH_INDEX, [latestKey])
    return
  }

  const index = parsedIndex ?? []
  const withoutLatest = index.filter(entry => entry !== latestKey)
  const nextIndex = [...withoutLatest, latestKey]

  if (nextIndex.length > MAX_CACHED_SEARCH_QUERIES) {
    const overflowCount = nextIndex.length - MAX_CACHED_SEARCH_QUERIES
    await AsyncStorage.multiRemove(nextIndex.slice(0, overflowCount))
  }

  await setCachedJson(CACHED_PLAYLIST_SEARCH_INDEX, nextIndex.slice(-MAX_CACHED_SEARCH_QUERIES))
}

const writeSearchCacheEntry = async (key: string, playlists: PlaylistData[]): Promise<void> => {
  await setCachedJson(key, playlists)
  await updateSearchCacheIndex(key)
}

const enqueueSearchCacheWrite = (key: string, playlists: PlaylistData[]): Promise<void> => {
  searchCacheWriteQueue = searchCacheWriteQueue
    .then(() => writeSearchCacheEntry(key, playlists))
    .catch(error => {
      console.error('Playlist search cache write failed:', error)
    })

  return searchCacheWriteQueue
}

const getPlaylistSearchCacheKey = (query: string): string =>
  `${CACHED_PLAYLIST_SEARCH}:${query.trim().toLowerCase()}`

export const getCachedPlaylistSearch = async (query: string): Promise<PlaylistData[] | undefined> =>
  getCachedJson(getPlaylistSearchCacheKey(query), playlistsArraySchema)

/**
 * Persists playlist search results for a query.
 * Never rejects: failures are caught and logged inside the write queue;
 * callers' `.catch` is a safety net only.
 * @param query - Normalized search query (trimmed, lowercased).
 * @param playlists - Results to cache; empty arrays are skipped.
 */
export const setCachedPlaylistSearch = async (
  query: string,
  playlists: PlaylistData[],
): Promise<void> => {
  if (playlists.length === 0) return

  const key = getPlaylistSearchCacheKey(query)

  await enqueueSearchCacheWrite(key, playlists)
}
