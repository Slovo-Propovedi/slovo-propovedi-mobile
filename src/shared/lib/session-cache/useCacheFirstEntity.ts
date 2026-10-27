import { useEffect, useRef } from 'react'
import { reportError } from '../../model/error-dialog'
import { type SessionCache } from './createSessionCache'
import { loadCacheFirst } from './loadCacheFirst'

/**
 * Mount load of one entity by id with stale-while-revalidate: the cached copy
 * (if any) is shown at once, then replaced by the server answer. A missing id or
 * a failed load without cache marks the entity as not found and reports the
 * error. Callbacks are read from refs, so only `id`/`fetcher` changes reload.
 * @param options - Load options.
 * @param options.cache - Entity cache keyed by id.
 * @param options.errorMessage - Message for the global error dialog.
 * @param options.fetcher - Write-through request (`cache.fetchThrough`).
 * @param options.id - Entity id.
 * @param options.onLoaded - Receives the cached and then the fresh entity.
 * @param options.onNotFound - Called when there is nothing to show.
 */
export const useCacheFirstEntity = <T>({
  cache,
  errorMessage,
  fetcher,
  id,
  onLoaded,
  onNotFound,
}: {
  cache: SessionCache<T>
  errorMessage: string
  fetcher: () => Promise<T>
  id: string
  onLoaded: (entity: T) => void
  onNotFound: () => void
}): void => {
  const onLoadedRef = useRef(onLoaded)
  const onNotFoundRef = useRef(onNotFound)

  useEffect(() => {
    onLoadedRef.current = onLoaded
    onNotFoundRef.current = onNotFound
  }, [onLoaded, onNotFound])

  useEffect(() => {
    let isActive = true

    if (!id) {
      onNotFoundRef.current()
      return
    }

    const apply = (entity: T) => {
      if (isActive) onLoadedRef.current(entity)
    }

    loadCacheFirst({ cache, cacheKey: id, fetcher, onCached: apply })
      .then(apply)
      .catch(error => {
        if (!isActive) return
        onNotFoundRef.current()
        reportError(error, errorMessage)
      })

    return () => {
      isActive = false
    }
  }, [cache, errorMessage, fetcher, id])
}
