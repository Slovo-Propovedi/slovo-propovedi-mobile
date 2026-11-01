/**
 * Serialized writes for the web audio cache commit manifest and the cross-tab
 * Web Locks mutex. Web Locks stop two tabs from interleaving a
 * read-modify-write and dropping a commit; the API is feature-detected (tests
 * have none) and a lost commit only forces a re-download.
 */

import { manifestCacheKey } from './webCacheManifestRead'

const MANIFEST_VERSION = 2
const MANIFEST_WRITE_LOCK = 'audio-manifest'

interface Manifest {
  unverified?: string[]
  urls: string[]
  version: number
}

const withManifestWriteLock = async <T>(write: () => Promise<T>): Promise<T> => {
  const locks = (
    globalThis as {
      navigator?: {
        locks?: { request: (name: string, callback: () => Promise<T>) => Promise<T> }
      }
    }
  ).navigator?.locks
  if (!locks?.request) return write()
  return locks.request(MANIFEST_WRITE_LOCK, write)
}

let manifestQueue: Promise<void> = Promise.resolve()

/**
 * Serialize a manifest write per tab and hold the cross-tab lock while it runs.
 * @param write - Read-modify-write to execute under the lock.
 */
export const enqueueManifestWrite = (write: () => Promise<void>): Promise<void> => {
  const locked = (): Promise<void> => withManifestWriteLock(write)
  const run = manifestQueue.then(locked, locked)
  // Keep the chain alive even when a write rejects, so later commits still run.
  manifestQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

/**
 * Write a v2 manifest without queueing (callers already hold the write slot).
 * @param cache - The audio cache bucket.
 * @param urls - Committed, fully verified URLs.
 * @param unverified - Legacy URLs still awaiting body verification.
 */
export const writeManifestNow = async (
  cache: Cache,
  urls: Set<string>,
  unverified: string[],
): Promise<void> => {
  const manifest: Manifest = { unverified, urls: [...urls], version: MANIFEST_VERSION }
  await cache.put(manifestCacheKey(), new Response(JSON.stringify(manifest)))
}

/**
 * Persist a v2 manifest through the serialized, cross-tab-locked write path.
 * @param cache - The audio cache bucket.
 * @param urls - Committed, fully verified URLs.
 * @param unverified - Legacy URLs still awaiting body verification.
 */
export const writeManifestState = async (
  cache: Cache,
  urls: Set<string>,
  unverified: string[],
): Promise<void> => {
  await enqueueManifestWrite(() => writeManifestNow(cache, urls, unverified))
}
