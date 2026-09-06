import { File } from 'expo-file-system'
import { PART_SUFFIX } from './cacheDownloader'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

/**
 * Delete orphaned `.mp3.part` temp files left behind when the app is killed
 * mid-download. Runs once at startup; best-effort, never throws.
 */
export const cleanupOrphanedDownloads = async (): Promise<void> => {
  try {
    const cacheDir = getAudioCacheDirectory()
    if (!cacheDir.exists) return
    const partFiles = cacheDir
      .list()
      .filter((item): item is File => item instanceof File && item.name.endsWith(PART_SUFFIX))
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
