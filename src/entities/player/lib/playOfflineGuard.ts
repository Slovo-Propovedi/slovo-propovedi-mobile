import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { showInfo } from 'shared/model/info-dialog'
import { bufferedProgressStateAtom } from './download-model'

const OFFLINE_PLAYBACK_MESSAGE =
  'Невозможно воспроизвести проповедь без интернета, если она не сохранена в офлайн'

/**
 * Guards offline playback: when the user is offline and the track is not
 * cached, shows a friendly informational dialog (side effect) and returns
 * true (blocking). When online or cached, returns false (allowing playback).
 * A cache-check failure is treated as "not cached".
 * When allowPartiallyBuffered is set, an offline track that was already
 * partially buffered in this session (bufferedProgressStateAtom matches the
 * URL with progress > 0) is allowed — the player's media buffer still holds
 * part of the file, so the listener can finish the buffered portion.
 * @param audioUrl - Network URL of the track being played.
 * @param isOnline - Current connectivity status.
 * @param allowPartiallyBuffered - Allow playback of a partially buffered track.
 */
export const guardOfflinePlayback = async (
  audioUrl: string,
  isOnline: boolean,
  allowPartiallyBuffered = false,
): Promise<boolean> => {
  if (isOnline) return false
  const isCached = await audioCacheService.isCached(audioUrl).catch(() => false)
  if (isCached) return false
  const buffered = ctx.get(bufferedProgressStateAtom)
  if (allowPartiallyBuffered && buffered?.url === audioUrl && buffered.progress > 0) return false
  showInfo(OFFLINE_PLAYBACK_MESSAGE)
  return true
}
