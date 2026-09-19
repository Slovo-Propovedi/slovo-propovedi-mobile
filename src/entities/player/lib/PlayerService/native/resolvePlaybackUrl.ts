import { audioCacheService, getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import { startBackgroundCaching } from '../BackgroundCachingService'

/**
 * Resolves the playback URL for a track: cached final file → retained partial
 * download (offline-only fallback) → network URL. Background caching is always
 * (re)armed for the network URL — while offline the attempt fast-fails and the
 * retry loop holds the partial alive and re-arms on reconnect.
 * Partial cleanup is owned by download-success deletion (cacheAudioWithProgress)
 * and the startup/reconnect sweeps — resolving never deletes: deleting here
 * kills an in-flight download's temp file (rename NoSuchFileException spam).
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
  if (partialUri && !ctx.get(isOnlineAtom)) return partialUri
  return audioUrl
}
