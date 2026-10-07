import { deleteAudioEntry, hasCompleteAudio } from './webCacheApi'

/**
 * Web has no local file URI: playback streams through the service worker, which
 * serves the cached bytes for the network URL.
 * @param _audioUrl - Network URL of the track.
 * @returns Always `null` on web.
 */
export const getPartialFileUri = async (_audioUrl: string): Promise<null | string> => null

/**
 * Deletes the web equivalent of a partial file: an uncommitted Cache Storage
 * entry left behind by a cancelled/killed download. A committed entry is the
 * final cached audio and must be kept, so it is left untouched.
 *
 * Best-effort and never throws (mirrors the native variant): callers use it
 * fire-and-forget. On a successful download the entry is committed, so this is
 * a no-op; only genuinely partial data is removed.
 * @param audioUrl - Network URL of the track.
 */
export const deletePartialFile = (audioUrl: string): void => {
  if (!audioUrl) return

  void (async () => {
    try {
      if (await hasCompleteAudio(audioUrl)) return
      await deleteAudioEntry(audioUrl)
    } catch (error) {
      console.warn('[partialFile] delete failed:', error)
    }
  })()
}
