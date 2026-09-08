import { action, type Ctx } from '@reatom/framework'
import { audioCacheService } from './AudioCacheService'
import { CacheCancelledError } from './CacheCancelledError'
import {
  activeCacheUrlAtom,
  cacheQueueAtom,
  type CacheQueueSource,
  clearAllProgressCallbacks,
  clearAllRequesters,
  clearProgressCallbacks,
  invokePlaylistRunStopper,
  pendingPromises,
  rejectPendingPromise,
  removeQueueEntry,
  removeRequester,
  resetQueueEngineState,
} from './cacheQueueState'

export { enqueueCache } from './cacheQueueEnqueue'
export {
  activeCacheUrlAtom,
  cacheQueueAtom,
  type CacheQueueEntry,
  type CacheQueueSource,
  getCacheRequesters,
  registerPlaylistRunStopper,
  unregisterPlaylistRunStopper,
} from './cacheQueueState'

export const isUrlQueued = (ctx: Ctx, url: string): boolean => url in ctx.get(cacheQueueAtom)

/**
 * Removes a queued URL, rejecting its promise with CacheCancelledError.
 * Active downloads are not cancelled. No-op when the URL is not queued.
 */
export const removeFromQueue = action((ctx, url: string): void => {
  removeQueueEntry(ctx, url)
  clearProgressCallbacks(url)
  rejectPendingPromise(url, new CacheCancelledError(url))
}, 'removeFromQueue')

const rejectQueuedUrls = (urls: string[], source: CacheQueueSource): void => {
  for (const url of urls) {
    removeRequester(url, source)
    clearProgressCallbacks(url)
    rejectPendingPromise(url, new CacheCancelledError(url))
  }
}

/**
 * Removes every queued entry with the given source, rejecting their promises.
 * Active downloads are not affected.
 */
export const removeFromQueueBySource = action((ctx, source: CacheQueueSource): void => {
  const queue = ctx.get(cacheQueueAtom)
  const removedUrls = Object.entries(queue)
    .filter(([, entry]) => entry.source === source)
    .map(([url]) => url)
  if (removedUrls.length === 0) return
  cacheQueueAtom(ctx, prev => {
    const next = { ...prev }
    for (const url of removedUrls) delete next[url]
    return next
  })
  rejectQueuedUrls(removedUrls, source)
}, 'removeFromQueueBySource')

/** Cancels a cache request unconditionally: removes the URL from the queue and aborts the inflight download. */
export const cancelCacheDownload = action((ctx, url: string): void => {
  removeFromQueue(ctx, url)
  audioCacheService.cancelAudioDownload(url)
}, 'cancelCacheDownload')

/**
 * Stops ALL caching: aborts the playlist run first (so it returns silently
 * without a false completion notification), cancels the active download, then
 * rejects every queued entry. Used by the global «Остановить все закачки»
 * action (fullscreen player's corner stop button, StopAllCachingButton via
 * useStopAllCaching). No-op when idle — with nothing active or queued it does
 * not even invoke the registered run stoppers.
 */
export const cancelAllCacheDownloads = action((ctx): void => {
  const activeUrl = ctx.get(activeCacheUrlAtom)
  const queuedUrls = Object.keys(ctx.get(cacheQueueAtom))
  if (!activeUrl && queuedUrls.length === 0) return
  invokePlaylistRunStopper()
  if (activeUrl) cancelCacheDownload(ctx, activeUrl)
  for (const url of queuedUrls) removeFromQueue(ctx, url)
}, 'cancelAllCacheDownloads')

export const _resetCacheQueueForTesting = (): void => {
  pendingPromises.clear()
  clearAllRequesters()
  clearAllProgressCallbacks()
  resetQueueEngineState()
}
