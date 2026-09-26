import { File } from 'expo-file-system'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

const LEGACY_PART_SUFFIX = '.mp3.part'

/**
 * Delete legacy `.mp3.part` orphan files left behind by app versions before
 * the `.cache.mp3` rename. Current `.cache.mp3` partials are intentional
 * (offline partial playback) and persist until the track is re-downloaded,
 * removed via removeFromCache, or the cache is cleared. Runs once at startup;
 * best-effort, never throws.
 */
export const cleanupOrphanedDownloads = async (): Promise<void> => {
  try {
    const cacheDir = getAudioCacheDirectory()
    if (!cacheDir.exists) return
    const partFiles = cacheDir
      .list()
      .filter(
        (item): item is File => item instanceof File && item.name.endsWith(LEGACY_PART_SUFFIX),
      )
    for (const partFile of partFiles)
      try {
        partFile.delete()
      } catch (error) {
        console.error('[audio-cache] Failed to delete orphaned part file:', partFile.name, error)
      }
  } catch (error) {
    console.error('[audio-cache] Failed to cleanup orphaned downloads:', error)
  }
}
