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
 * Progress is persisted after every entry through `updateManifestState`, whose
 * merge reads the manifest again under the write lock: a commit from another
 * slice or tab that landed since this pass read the state is unioned in, not
 * overwritten. A budget-exhausted pass resumes where it stopped on the next
 * startup or after a commit, and concurrent callers share one in-flight pass.
 */

import { isCacheStorageAvailable, openAudioCache } from './openAudioCache'
import { readManifestState } from './webCacheManifestRead'
import { updateManifestState } from './webCacheManifestStore'

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
        // Best-effort abort of a lying body; awaiting cancel can stall the pass.
        void reader.cancel().catch(() => undefined)
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

type EntryOutcome = 'dropped' | 'verified'

const verifyEntry = async (cache: Cache, url: string): Promise<EntryOutcome> => {
  const response = await cache.match(url, { ignoreVary: true })
  if (!response) return 'dropped'
  if (await isEntryComplete(response)) return 'verified'
  await cache.delete(url, { ignoreVary: true })
  return 'dropped'
}

const persistProgress = async (
  cache: Cache,
  verified: Set<string>,
  processed: Set<string>,
): Promise<void> => {
  // Another tab's commit of the same URL is fresh bytes, so the union wins.
  await updateManifestState(cache, state => ({
    unverified: state.unverified.filter(url => !processed.has(url)),
    urls: new Set([...state.urls, ...verified]),
  }))
}

const runMigration = async (
  cache: Cache,
  budgetMs: number,
  now: () => number,
): Promise<boolean> => {
  const startedAt = now()
  const verified = new Set<string>()
  const processed = new Set<string>()
  let state = await readManifestState(cache)
  while (state.unverified.length > 0) {
    const [nextUrl] = state.unverified
    processed.add(nextUrl)
    if ((await verifyEntry(cache, nextUrl)) === 'verified') verified.add(nextUrl)
    await persistProgress(cache, verified, processed)
    const outOfBudget = now() - startedAt >= budgetMs
    state = await readManifestState(cache)
    if (outOfBudget) break
  }
  return state.unverified.length === 0
}

let migrationInflight: null | Promise<boolean> = null

/**
 * Verify unverified manifest entries within a time budget. Returns true when
 * the list is exhausted (migration complete). Concurrent callers share one
 * pass, so the startup slice and a post-download slice never overlap.
 * @param cache - The audio cache bucket.
 * @param budgetMs - Wall-clock budget for this pass.
 * @param now - Clock, injectable for tests.
 */
export const migrateAudioManifest = (
  cache: Cache,
  budgetMs: number = MANIFEST_MIGRATION_BUDGET_MS,
  now: () => number = Date.now,
): Promise<boolean> => {
  if (migrationInflight) return migrationInflight
  migrationInflight = runMigration(cache, budgetMs, now).finally(() => {
    migrationInflight = null
  })
  return migrationInflight
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
