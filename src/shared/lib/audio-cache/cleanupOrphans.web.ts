import { deleteAudioEntry } from './webCacheApi'
import { clearActiveDownloads, getActiveDownloads } from './webDownloadJournal'

/**
 * Delete uncommitted cache entries left behind when the app is killed
 * mid-download. Runs once at startup. Deliberately does NOT enumerate the
 * bucket (which could crash-loop an iOS PWA with a corrupt bucket — WebKit
 * bugs 260962/277598); it only deletes the URLs still listed in the
 * active-downloads journal. When no download was in flight, returns
 * immediately without touching `caches` at all. Best-effort, never throws.
 */
export const cleanupOrphanedDownloads = async (): Promise<void> => {
  try {
    const urls = await getActiveDownloads()
    if (urls.length === 0) return
    for (const url of urls)
      try {
        await deleteAudioEntry(url)
      } catch (error) {
        console.error('[audio-cache] Failed to delete orphaned download:', url, error)
      }
    await clearActiveDownloads()
  } catch (error) {
    console.error('[audio-cache] Failed to cleanup orphaned downloads:', error)
  }
}
