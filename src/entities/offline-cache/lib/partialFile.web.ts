import { deleteAudioEntry, hasCompleteAudio } from './webCacheApi'
import { wasDownloadCompleted } from './webCompletedDownloads'

/**
 * Web has no local file URI: playback streams through the service worker, which
 * serves the cached bytes for the network URL.
 * @param _audioUrl - Network URL of the track.
 * @returns Always `null` on web.
 */
export const getPartialFileUri = async (_audioUrl: string): Promise<null | string> => null

/**
 * Deletes a genuinely partial web entry: an uncommitted Cache Storage entry that
 * this session did not complete a download for (e.g. A stale leftover). A
 * committed entry, or one whose `cache.put` completed this session even if the
 * manifest commit failed, is complete data and must be kept — the orphan sweep
 * reconciles the rest.
 *
 * Best-effort and never throws (mirrors the native variant): callers use it
 * fire-and-forget.
 * @param audioUrl - Network URL of the track.
 */
export const deletePartialFile = (audioUrl: string): void => {
  if (!audioUrl) return

  void (async () => {
    try {
      if (wasDownloadCompleted(audioUrl)) return
      if (await hasCompleteAudio(audioUrl)) return
      await deleteAudioEntry(audioUrl)
    } catch (error) {
      console.warn('[partialFile] delete failed:', error)
    }
  })()
}
