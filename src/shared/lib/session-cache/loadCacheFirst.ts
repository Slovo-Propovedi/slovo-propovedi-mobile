import { showToast } from '../../model/toast'
import { getHttpStatus } from '../error-utils'
import { ctx } from '../reatom-ctx/ctx'
import { type SessionCache } from './createSessionCache'

const STALE_DATA_MESSAGE = 'Нет связи с сервером — показаны сохранённые данные'

// The server answered and refused (404 for a deleted entity, 403 …): the cached
// copy is no longer valid, so it must not be shown in place of the error.
const isClientError = (error: unknown): boolean => {
  const status = getHttpStatus(error)

  return status !== undefined && status >= 400 && status < 500
}

/**
 * Stale-while-revalidate load: `onCached` gets the cached value as soon as it
 * is read (if the network has not answered yet), while `fetcher` — normally a
 * `cache.fetchThrough(...)` call — revalidates in parallel.
 *
 * Resolves with the network value. On a network/5xx failure it falls back to
 * the cached value (with a toast) and resolves with it; it rejects only when
 * there is nothing cached or the server rejected the request (4xx, the entry
 * is dropped then).
 * @param options - Load options.
 * @param options.cache - Cache holding the value.
 * @param options.cacheKey - Key inside the cache.
 * @param options.fetcher - Network request (write-through).
 * @param options.onCached - Receives the cached value before the network answers.
 */
export const loadCacheFirst = async <T>({
  cache,
  cacheKey,
  fetcher,
  onCached,
}: {
  cache: SessionCache<T>
  cacheKey: string
  fetcher: () => Promise<T>
  onCached: (value: T) => void
}): Promise<T> => {
  let isNetworkDone = false

  const cachedPromise = cache.read(cacheKey).then(value => {
    if (value !== undefined && !isNetworkDone) onCached(value)
    return value
  })

  try {
    const value = await fetcher()
    isNetworkDone = true
    return value
  } catch (error) {
    if (isClientError(error)) {
      isNetworkDone = true
      void cache.remove(cacheKey)
      throw error
    }

    const cached = await cachedPromise
    isNetworkDone = true
    if (cached === undefined) throw error

    console.error('[session-cache] network failed, showing cached data:', error)
    showToast(ctx, STALE_DATA_MESSAGE)
    return cached
  }
}
