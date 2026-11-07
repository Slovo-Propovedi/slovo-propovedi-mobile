import { type SessionCache } from '../session-cache/createSessionCache'
import { loadCacheFirst } from '../session-cache/loadCacheFirst'

export interface FirstPageCache<T> {
  /** Cache key of the current filter combination. */
  key: string
  store: SessionCache<T[]>
}

/**
 * First-page request of a paginated list. Without a cache it is a plain
 * `fetchPage(1)`. With one the page is written through, and the very first
 * load (`isInitial`) shows the cached page via `onCached` while the network
 * revalidates (see `loadCacheFirst`).
 * @param options - Request options.
 * @param options.cache - Optional first-page cache.
 * @param options.fetchPage - Page loader.
 * @param options.isInitial - Whether nothing has been loaded from the network yet.
 * @param options.onCached - Receives the cached page.
 */
export const fetchFirstPage = <T>({
  cache,
  fetchPage,
  isInitial,
  onCached,
}: {
  cache?: FirstPageCache<T>
  fetchPage: (page: number) => Promise<T[]>
  isInitial: boolean
  onCached: (page: T[]) => void
}): Promise<T[]> => {
  if (!cache) return fetchPage(1)

  const fetcher = () => cache.store.fetchThrough(cache.key, () => fetchPage(1))
  if (!isInitial) return fetcher()

  return loadCacheFirst({ cache: cache.store, cacheKey: cache.key, fetcher, onCached })
}
