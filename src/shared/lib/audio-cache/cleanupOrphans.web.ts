import { openAudioCache } from './openAudioCache'
import { deleteAudioEntry } from './webCacheApi'
import { isUrlCommitted, readCommittedUrls } from './webCacheManifest'
import {
  type ActiveDownloadEntry,
  getActiveDownloads,
  removeActiveDownloadEntries,
} from './webDownloadJournal'

/**
 * A journal entry is considered dead only after this many milliseconds without
 * a heartbeat refresh (6 missed 10s heartbeats).
 */
export const STALE_MS = 60_000

/**
 * Delete uncommitted cache entries left behind when the app is killed
 * mid-download. Runs once at startup. Deliberately does NOT enumerate the
 * bucket (which could crash-loop an iOS PWA with a corrupt bucket — WebKit
 * bugs 260962/277598); it only deletes the URLs still listed in the
 * active-downloads journal. When no download was in flight, returns
 * immediately without touching `caches` at all. Best-effort, never throws.
 *
 * Multi-tab safety: the journal is shared between tabs, so an entry with a
 * fresh `lastSeenAt` is assumed to belong to a LIVE download in another tab
 * and is skipped without any cache access. A stale entry that is committed in
 * the manifest is a completed download whose tab died before removing the
 * journal row — the cache entry is kept, only the journal row is dropped.
 */
export const cleanupOrphanedDownloads = async (): Promise<void> => {
  try {
    const entries = await getActiveDownloads()
    if (entries.length === 0) return
    const now = Date.now()
    const stale = entries.filter(entry => now - entry.lastSeenAt >= STALE_MS)
    if (stale.length === 0) return
    await deleteOrphanedEntries(stale)
    await removeActiveDownloadEntries(stale)
  } catch (error) {
    console.error('[audio-cache] Failed to cleanup orphaned downloads:', error)
  }
}

const deleteOrphanedEntries = async (entries: ActiveDownloadEntry[]): Promise<void> => {
  const cache = await openAudioCache()
  const committed = await readCommittedUrls(cache)
  for (const entry of entries) {
    const isCommitted = committed != null && isUrlCommitted(committed, entry.url)
    if (isCommitted) {
      console.warn('[audio-cache] Dropping journal row for committed download:', entry.url)
      continue
    }
    try {
      await deleteAudioEntry(entry.url)
    } catch (error) {
      console.error('[audio-cache] Failed to delete orphaned download:', entry.url, error)
    }
  }
}
