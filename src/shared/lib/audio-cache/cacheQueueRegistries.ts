import { type CacheQueueSource } from './cacheQueueState'

/** Sources that have enqueued a URL and whose download has not settled yet. */
export const requesters = new Map<string, Set<CacheQueueSource>>()

/** Progress callbacks registered for queued entries, forwarded once the runner starts. */
export const progressCallbacks = new Map<string, Set<(progress: number) => void>>()

const EMPTY_REQUESTERS: ReadonlySet<CacheQueueSource> = new Set()

export const addRequester = (url: string, source: CacheQueueSource): void => {
  const set = requesters.get(url)
  if (set) set.add(source)
  else requesters.set(url, new Set([source]))
}

export const removeRequester = (url: string, source: CacheQueueSource): void => {
  const set = requesters.get(url)
  if (!set) return
  set.delete(source)
  if (set.size === 0) requesters.delete(url)
}

export const clearRequesters = (url: string): void => {
  requesters.delete(url)
}

export const clearAllRequesters = (): void => {
  requesters.clear()
}

export const getCacheRequesters = (url: string): ReadonlySet<CacheQueueSource> =>
  requesters.get(url) ?? EMPTY_REQUESTERS

export const addProgressCallback = (url: string, callback: (progress: number) => void): void => {
  const set = progressCallbacks.get(url)
  if (set) set.add(callback)
  else progressCallbacks.set(url, new Set([callback]))
}

export const takeProgressCallbacks = (url: string): Set<(progress: number) => void> => {
  const callbacks = progressCallbacks.get(url)
  progressCallbacks.delete(url)
  return callbacks ?? new Set()
}

export const clearProgressCallbacks = (url: string): void => {
  progressCallbacks.delete(url)
}

export const clearAllProgressCallbacks = (): void => {
  progressCallbacks.clear()
}
