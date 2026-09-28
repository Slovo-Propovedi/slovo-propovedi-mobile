import { useAtom, useCtx } from '@reatom/npm-react'
import { useCallback } from 'react'
import {
  activeCacheUrlAtom,
  cacheQueueAtom,
  cancelAllCacheDownloads,
  sermonCachingEnabledAtom,
} from 'entities/offline-cache'

/**
 * Reactive "is any caching active" state plus the global stop action behind the
 * fullscreen player's «Остановить все закачки» button. Visible whenever the
 * queue is non-empty or a download is active; the action aborts the active
 * download and rejects every queued entry (see `cancelAllCacheDownloads`).
 * Hidden entirely while sermon caching is disabled — there is nothing to stop.
 */
export const useStopAllCaching = () => {
  const ctx = useCtx()
  const [queue] = useAtom(cacheQueueAtom)
  const [activeUrl] = useAtom(activeCacheUrlAtom)
  const [isSermonCachingEnabled] = useAtom(sermonCachingEnabledAtom)

  const isCachingActive = Object.keys(queue).length > 0 || activeUrl !== null
  const isStopAllCachingVisible = isCachingActive && isSermonCachingEnabled

  const handleStopAllCaching = useCallback(() => {
    cancelAllCacheDownloads(ctx)
  }, [ctx])

  return { handleStopAllCaching, isStopAllCachingVisible }
}
