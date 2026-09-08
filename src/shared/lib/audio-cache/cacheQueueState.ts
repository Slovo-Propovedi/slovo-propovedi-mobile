import { atom, type Ctx } from '@reatom/framework'
import {
  addProgressCallback,
  addRequester,
  clearAllProgressCallbacks,
  clearAllRequesters,
  clearProgressCallbacks,
  clearRequesters,
  getCacheRequesters,
  progressCallbacks,
  removeRequester,
  requesters,
  takeProgressCallbacks,
} from './cacheQueueRegistries'

export interface CacheQueueEntry {
  enqueuedAt: number
  source: CacheQueueSource
}

export type CacheQueueSource = 'auto' | 'manual' | 'playlist'

export interface Deferred<T> {
  promise: Promise<T>
  reject: (error: unknown) => void
  resolve: (value: T) => void
}

export const cacheQueueAtom = atom<Record<string, CacheQueueEntry>>({}, 'cacheQueueAtom')

export const pendingPromises = new Map<string, Deferred<string>>()

let enqueueCounter = 0

let runnerActive = false

export const nextEnqueuedAt = (): number => enqueueCounter++

export const isRunnerActive = (): boolean => runnerActive

export const setRunnerActive = (active: boolean): void => {
  runnerActive = active
}

/** URL of the currently active download (the entry the runner is processing), or null when idle. */
export const activeCacheUrlAtom = atom<null | string>(null, 'activeCacheUrlAtom')

/**
 * Stoppers registered by playlist cache runs so the global stop
 * (`cancelAllCacheDownloads`) can abort a run that outlives its screen. FSD
 * inversion: widgets cannot import pages, so the run registers its stopper here
 * (shared) and the fullscreen player's corner stop button (StopAllCachingButton
 * via useStopAllCaching) invokes it.
 */
const playlistRunStoppers = new Set<() => void>()

export const registerPlaylistRunStopper = (stopper: () => void): void => {
  playlistRunStoppers.add(stopper)
}

/**
 * Identity-based removal: an old run's finally must never remove a NEW run's stopper.
 * @param stopper - The stopper to remove from the registry.
 */
export const unregisterPlaylistRunStopper = (stopper: () => void): void => {
  playlistRunStoppers.delete(stopper)
}

/** Invokes every registered run stopper; a no-op when none are registered. */
export const invokePlaylistRunStopper = (): void => {
  for (const stopper of playlistRunStoppers) stopper()
}

export const resetQueueEngineState = (): void => {
  enqueueCounter = 0
  runnerActive = false
  playlistRunStoppers.clear()
}

export const createDeferred = <T>(): Deferred<T> => {
  let resolve: (value: T) => void = () => {}
  let reject: (error: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  // Sentinel: a rejection landing before any awaiter attaches must not surface
  // as an unhandled rejection (Phase 3.0).
  promise.catch(() => {})
  return { promise, reject, resolve }
}

export const removeQueueEntry = (ctx: Ctx, url: string): void => {
  cacheQueueAtom(ctx, prev => {
    if (!(url in prev)) return prev
    const next = { ...prev }
    delete next[url]
    return next
  })
  clearRequesters(url)
}

export const rejectPendingPromise = (url: string, error: unknown): void => {
  const deferred = pendingPromises.get(url)
  if (deferred) {
    pendingPromises.delete(url)
    deferred.reject(error)
  }
}

export {
  addProgressCallback,
  addRequester,
  clearAllProgressCallbacks,
  clearAllRequesters,
  clearProgressCallbacks,
  clearRequesters,
  getCacheRequesters,
  progressCallbacks,
  removeRequester,
  requesters,
  takeProgressCallbacks,
}
