import { audioCacheService, deletePartialFile, getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import { startBackgroundCaching } from '../BackgroundCachingService'

/**
 * Resolves the playback URL for a track: cached final file → retained partial
 * download (offline-only fallback) → network URL. Background caching is always
 * (re)armed for the network URL — while offline the attempt fast-fails and the
 * retry loop holds the partial alive and re-arms on reconnect.
 * @param audioUrl - Network URL of the track being played.
 * @returns URI to hand to the native player.
 */
export const resolvePlaybackUrl = async (audioUrl: string): Promise<string> => {
  try {
    const cachedUri = await audioCacheService.getCachedUri(audioUrl)
    if (cachedUri) return cachedUri
  } catch (error) {
    console.error('[AudioLoader] resolvePlaybackUrl: Error checking cache:', error)
    reportError(error, 'Ошибка при проверке офлайн-копии аудио')
  }
  startBackgroundCaching(audioUrl)
  const partialUri = await getPartialFileUri(audioUrl)
  if (partialUri) {
    // Offline: play the retained partial — POSIX keeps the player's open FD
    // alive across later stale-drop/rename.
    if (!ctx.get(isOnlineAtom)) return partialUri
    // Online: the re-request supersedes the partial — the full audio is
    // re-fetched (user requirement), so the stale buffered part is dropped.
    try {
      deletePartialFile(audioUrl)
    } catch (error) {
      console.warn('[resolvePlaybackUrl] partial delete failed:', error)
    }
  }
  return audioUrl
}
