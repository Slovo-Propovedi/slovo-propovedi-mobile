import { action, type Ctx } from '@reatom/framework'
import { audioCacheService } from './AudioCacheService'
import { kickRunner } from './cacheQueueRunner'
import {
  addProgressCallback,
  addRequester,
  cacheQueueAtom,
  type CacheQueueSource,
  clearRequesters,
  createDeferred,
  type Deferred,
  nextEnqueuedAt,
  pendingPromises,
} from './cacheQueueState'
import { inflightCache } from './inflightCache'

export const joinInflight = (
  url: string,
  source: CacheQueueSource,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  addRequester(url, source)
  const promise = audioCacheService.cacheAudio(url, onProgress)
  // Clean requesters when the shared download settles.
  void promise.then(
    () => clearRequesters(url),
    () => clearRequesters(url),
  )
  return promise
}

export const registerFresh = (
  url: string,
  source: CacheQueueSource,
  onProgress?: (progress: number) => void,
): Deferred<string> => {
  const deferred = createDeferred<string>()
  pendingPromises.set(url, deferred)
  addRequester(url, source)
  if (onProgress) addProgressCallback(url, onProgress)
  return deferred
}

const enqueueFresh = (
  ctx: Ctx,
  url: string,
  source: CacheQueueSource,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const deferred = registerFresh(url, source, onProgress)
  const enqueuedAt = nextEnqueuedAt()
  cacheQueueAtom(ctx, prev => ({ ...prev, [url]: { enqueuedAt, source } }))
  kickRunner(ctx)
  return deferred.promise
}

/**
 * An inflight entry is joinable unless it was aborted. After `cancelAudioDownload`
 * marks the entry aborted but before it settles, re-enqueueing the URL must start
 * a FRESH download instead of joining the dying (rejecting) promise (Bug B).
 * @param url - The audio URL to check.
 */
export const inflightIsJoinable = (url: string): boolean => {
  const entry = inflightCache.get(url)
  return entry !== undefined && !entry.aborted
}

const joinQueued = (
  ctx: Ctx,
  url: string,
  source: CacheQueueSource,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  const queued = pendingPromises.get(url)
  if (queued) {
    addRequester(url, source)
    if (onProgress) addProgressCallback(url, onProgress)
    return queued.promise
  }
  if (inflightIsJoinable(url)) return joinInflight(url, source, onProgress)
  return enqueueFresh(ctx, url, source, onProgress)
}

/**
 * Enqueues a cache request, deduplicating a URL that is already queued or
 * downloading by joining the existing promise.
 * @param onProgress - Progress callback (0..1): retroactive seed for an
 * inflight join, forwarded once the runner starts a queued entry.
 */
export const enqueueCache = action(
  (
    ctx: Ctx,
    url: string,
    source: CacheQueueSource,
    onProgress?: (progress: number) => void,
  ): Promise<string> => {
    if (!url) throw new Error('[cacheQueue] audioUrl is required')
    return joinQueued(ctx, url, source, onProgress)
  },
  'enqueueCache',
)
