import { type Ctx } from '@reatom/framework'
import { cacheAudioWithProgress } from './cacheAudioWithProgress'
import { isCacheCancelledError } from './CacheCancelledError'
import {
  activeCacheUrlAtom,
  cacheQueueAtom,
  clearAllProgressCallbacks,
  clearAllRequesters,
  clearRequesters,
  isRunnerActive,
  pendingPromises,
  setRunnerActive,
  takeProgressCallbacks,
} from './cacheQueueState'

const pickNextEntry = (ctx: Ctx): null | string => {
  const queue = ctx.get(cacheQueueAtom)
  let bestUrl: null | string = null
  let bestEnqueuedAt = Number.POSITIVE_INFINITY
  for (const [url, entry] of Object.entries(queue))
    if (entry.enqueuedAt < bestEnqueuedAt) {
      bestEnqueuedAt = entry.enqueuedAt
      bestUrl = url
    }

  return bestUrl
}

const dequeueEntry = (ctx: Ctx, url: string): void => {
  cacheQueueAtom(ctx, prev => {
    if (!(url in prev)) return prev
    const next = { ...prev }
    delete next[url]
    return next
  })
}

const forwardProgress =
  (callbacks: Set<(progress: number) => void>) =>
  (progress: number): void => {
    for (const callback of callbacks)
      try {
        callback(progress)
      } catch (error) {
        console.error('[cacheQueue] onProgress callback error:', error)
      }
  }

const processEntry = async (ctx: Ctx, url: string): Promise<void> => {
  const deferred = pendingPromises.get(url)
  // Dequeue inline (NOT via removeQueueEntry): requesters must survive the
  // dequeue so cancelPlaylistCache can see joiners of the active download.
  dequeueEntry(ctx, url)
  pendingPromises.delete(url)
  if (!deferred) throw new Error(`[cacheQueue] No pending promise for ${url}`)
  activeCacheUrlAtom(ctx, url)
  const callbacks = takeProgressCallbacks(url)
  const onProgress = callbacks.size > 0 ? forwardProgress(callbacks) : undefined
  try {
    const uri = await cacheAudioWithProgress(ctx, url, onProgress)
    deferred.resolve(uri)
  } catch (error) {
    if (!isCacheCancelledError(error)) console.warn('[cacheQueue] Error caching:', error)
    deferred.reject(error)
  } finally {
    activeCacheUrlAtom(ctx, null)
    clearRequesters(url)
  }
}

const drainPendingEntries = (ctx: Ctx, error: unknown): void => {
  for (const [url, deferred] of pendingPromises) {
    deferred.reject(error)
    pendingPromises.delete(url)
  }
  cacheQueueAtom(ctx, {})
  clearAllRequesters()
  clearAllProgressCallbacks()
}

const runQueue = async (ctx: Ctx): Promise<void> => {
  try {
    while (true) {
      const next = pickNextEntry(ctx)
      if (!next) break
      await processEntry(ctx, next)
    }
  } catch (error) {
    drainPendingEntries(ctx, error)
  } finally {
    setRunnerActive(false)
    // Lost-kick guard: an entry enqueued between the final pickNextEntry and
    // setRunnerActive(false) would be stranded; re-kick if the queue is non-empty.
    if (pickNextEntry(ctx) !== null) kickRunner(ctx)
  }
}

export const kickRunner = (ctx: Ctx): void => {
  if (isRunnerActive()) return
  setRunnerActive(true)
  void runQueue(ctx)
}
