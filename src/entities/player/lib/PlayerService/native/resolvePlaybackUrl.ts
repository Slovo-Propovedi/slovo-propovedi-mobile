import { audioCacheService, getPartialFileUri } from 'shared/lib/audio-cache'
import { reportError } from 'shared/model/error-dialog'
import { startBackgroundCaching } from '../BackgroundCachingService'

/**
 * Resolves the playback URL for a track: cached final file → retained partial
 * download (offline playback of what exists) → network URL. Background caching
 * is always (re)armed for the network URL — while offline the attempt
 * fast-fails and the retry loop holds the partial alive and re-arms on
 * reconnect.
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
  if (partialUri) return partialUri
  return audioUrl
}
