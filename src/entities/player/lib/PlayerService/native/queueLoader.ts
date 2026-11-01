import { type AudioPlaylist } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { setIsSeekingAction, setSeekTargetAction } from '../../../model'
import { startBackgroundCaching } from '../BackgroundCachingService'
import { audioEffectsAttach } from './audioEffectsAttach'
import { playbackController } from './PlaybackController'
import { playlistEngine } from './PlaylistEngine'
import { readQueueContext } from './queueContext'
import { findQueueIndex } from './queueSwitch'
import { seekGuard } from './SeekGuard'

/**
 * Builds the native queue for a load request and applies stored preferences.
 * @param audioUrl - Network URL of the requested track.
 * @param initialPositionMs - Resume position in milliseconds.
 */
export const loadQueue = async (
  audioUrl: string,
  initialPositionMs: number,
): Promise<AudioPlaylist | null> => {
  const queue = await readQueueContext(audioUrl)
  // Release the old effects chain before its native player dies with the queue.
  audioEffectsAttach.detach()
  const playlist = await playlistEngine.buildQueue(
    queue.tracks,
    queue.sources,
    queue.startIndex,
    queue.loop,
    initialPositionMs,
  )
  if (!playlist) return null

  playbackController.applyPreferences(playlist)
  // Re-assert the stored volume into the fresh native instance AND the atom:
  // the first status tick reports the instance default (1) before preferences land.
  playbackController.applyVolume(playlist, playbackController.getVolume())
  startBackgroundCaching(audioUrl)
  return playlist
}

const SKIP_SETTLE_POLL_MS = 50
const SKIP_SETTLE_TIMEOUT_MS = 1000

/**
 * The skipToIndex call is fire-and-forget; seeking before the engine reports
 * the target index can land on the old item and lose the resume position.
 * Wait (bounded) until the engine's current index matches, then seek.
 * @param index - Queue index the engine should settle on.
 */
const waitForQueueSkip = async (index: number): Promise<void> => {
  const deadline = Date.now() + SKIP_SETTLE_TIMEOUT_MS
  while (playlistEngine.getCurrentIndex() !== index && Date.now() < deadline)
    await new Promise(resolve => setTimeout(resolve, SKIP_SETTLE_POLL_MS))
}

/**
 * Switches inside the existing queue (manual next/prev, same-track restart) via
 * skipTo + seekTo; rebuilds a one-track queue when the target is not queued.
 * @param audioUrl - Network URL of the requested track.
 * @param initialPositionMs - Resume position in milliseconds.
 */
export const replaceQueueTrack = async (
  audioUrl: string,
  initialPositionMs: number,
): Promise<AudioPlaylist | null> => {
  const index = await findQueueIndex(audioUrl)
  const playlist = playlistEngine.getPlaylist()
  if (index < 0 || !playlist) return loadQueue(audioUrl, initialPositionMs)

  if (index !== playlistEngine.getCurrentIndex()) {
    playlistEngine.skipToIndex(index)
    await waitForQueueSkip(index)
  }

  const positionMs = Math.max(0, initialPositionMs)
  // Mirror PlaybackController.seekTo: the guard's safety timeout clears the
  // seeking state when no fresh position event arrives.
  seekGuard.arm()
  void setIsSeekingAction(ctx, true)
  void setSeekTargetAction(ctx, positionMs)
  await playlistEngine.seekTo(positionMs / 1000)
  startBackgroundCaching(audioUrl)
  return playlist
}
