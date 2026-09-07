import { audioCacheService } from 'shared/lib/audio-cache'
import { reportError } from 'shared/model/error-dialog'

const OFFLINE_PLAYBACK_MESSAGE = 'Невозможно воспроизвести незакешированную проповедь без интернета'

/**
 * Guards offline playback: when the user is offline and the track is not
 * cached, shows a friendly error dialog (side effect) and returns true
 * (blocking). When online or cached, returns false (allowing playback).
 * A cache-check failure is treated as "not cached".
 * @param audioUrl - Network URL of the track being played.
 * @param isOnline - Current connectivity status.
 */
export const guardOfflinePlayback = async (
  audioUrl: string,
  isOnline: boolean,
): Promise<boolean> => {
  if (isOnline) return false
  const isCached = await audioCacheService.isCached(audioUrl).catch(() => false)
  if (isCached) return false
  reportError(new Error(OFFLINE_PLAYBACK_MESSAGE), OFFLINE_PLAYBACK_MESSAGE)
  return true
}
