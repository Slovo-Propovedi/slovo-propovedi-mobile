import z from 'zod'
import { type SermonData, sermonSchema } from 'entities/sermon'
import { CACHED_SERMON_SEARCH, CACHED_SERMON_SEARCH_INDEX } from 'shared/config'
import { createQueryCache, getQueryCacheKey } from 'shared/lib/cache'

export const MAX_CACHED_SEARCH_QUERIES = 30

const sermonsArraySchema = z.array(sermonSchema)

export const getSearchCacheKey = (query: string): string =>
  getQueryCacheKey(CACHED_SERMON_SEARCH, query)

const sermonSearchCache = createQueryCache({
  indexKey: CACHED_SERMON_SEARCH_INDEX,
  label: 'Search',
  maxEntries: MAX_CACHED_SEARCH_QUERIES,
  prefix: CACHED_SERMON_SEARCH,
  schema: sermonsArraySchema,
})

/**
 * Reads cached sermon search results for a query.
 * @param query - Search query (normalized internally).
 */
export const getCachedSearchResults = (query: string): Promise<SermonData[] | undefined> =>
  sermonSearchCache.get(query)

/**
 * Persists sermon search results for a query.
 * Never rejects: failures are caught and logged inside the write queue;
 * callers' `.catch` is a safety net only.
 * @param query - Normalized search query (trimmed, lowercased).
 * @param sermons - Results to cache; empty arrays are skipped.
 */
export const setCachedSearchResults = (query: string, sermons: SermonData[]): Promise<void> =>
  sermonSearchCache.set(query, sermons)
