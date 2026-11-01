/**
 * Verifies legacy web-audio cache entries listed in the manifest as `unverified`.
 *
 * Before manifest v2 the bucket was trusted wholesale, so an entry truncated by
 * a process kill mid-`put` could be committed and later played as broken bytes
 * offline. Every downloaded entry now carries an exact `Content-Length`; this
 * runner stream-counts the body (never accumulating it in memory) and commits a
 * URL only when the byte count matches. Anything else — a missing/opaque body,
 * a length mismatch or a stream error — is deleted and dropped from the
 * manifest: unverifiable bytes can never be proven complete, and deleting
 * self-heals through a normal re-download on demand.
 *
 * Progress is persisted after every entry, so a budget-exhausted pass resumes
 * where it stopped on the next startup or after a commit.
 */

import { isCacheStorageAvailable, openAudioCache } from './openAudioCache'
import { type ManifestState, readManifestState } from './webCacheManifestRead'
import { writeManifestState } from './webCacheManifestStore'

const MANIFEST_MIGRATION_BUDGET_MS = 3000

const countStreamedBytes = async (response: Response, limit: number): Promise<null | number> => {
  if (!response.body) return null
  const reader = response.body.getReader()
  let count = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return count
      count += value?.length ?? 0
      if (count > limit) {
        await reader.cancel()
        return count
      }
    }
  } catch {
    return null
  }
}

const isEntryComplete = async (response: Response): Promise<boolean> => {
  const contentLength = Number(response.headers.get('Content-Length')) || 0
  if (contentLength <= 0) return false
  return (await countStreamedBytes(response, contentLength)) === contentLength
}

const persist = (cache: Cache, urls: Set<string>, unverified: string[]): Promise<ManifestState> =>
  writeManifestState(cache, urls, unverified).then(() => ({ unverified, urls }))

const verifyEntry = async (cache: Cache, state: ManifestState): Promise<ManifestState> => {
  const [nextUrl, ...rest] = state.unverified
  const response = await cache.match(nextUrl, { ignoreVary: true })
  if (!response) return persist(cache, state.urls, rest)
  if (!(await isEntryComplete(response))) {
    await cache.delete(nextUrl, { ignoreVary: true })
    return persist(cache, state.urls, rest)
  }
  return persist(cache, new Set([...state.urls, nextUrl]), rest)
}

/**
 * Verify unverified manifest entries within a time budget. Returns true when
 * the list is exhausted (migration complete).
 * @param cache - The audio cache bucket.
 * @param budgetMs - Wall-clock budget for this pass.
 * @param now - Clock, injectable for tests.
 */
export const migrateAudioManifest = async (
  cache: Cache,
  budgetMs: number = MANIFEST_MIGRATION_BUDGET_MS,
  now: () => number = Date.now,
): Promise<boolean> => {
  const startedAt = now()
  let state = await readManifestState(cache)
  while (state.unverified.length > 0) {
    state = await verifyEntry(cache, state)
    if (now() - startedAt >= budgetMs) break
  }
  return state.unverified.length === 0
}

/**
 * Best-effort startup/download trigger for a migration slice. Never throws.
 */
export const resumeAudioManifestMigration = async (): Promise<void> => {
  if (!isCacheStorageAvailable()) return
  try {
    const cache = await openAudioCache()
    await migrateAudioManifest(cache)
  } catch (error) {
    console.error('[audio-cache] manifest migration failed:', error)
  }
}
