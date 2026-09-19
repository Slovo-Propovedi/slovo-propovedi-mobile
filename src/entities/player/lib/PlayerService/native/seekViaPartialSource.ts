import { getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import {
  currentAudioAtom,
  pauseTypeAtom,
  setIsSeekingAction,
  setPositionAction,
  setSeekTargetAction,
} from '../../../model'
import { scheduleHistoryFlush } from '../progressFlusher'
import { type SeekSourceSwap } from '../types'
import { audioLoader } from './AudioLoader'
import { seekGuard } from './SeekGuard'

const CACHE_URI_PREFIX = 'file://'

/**
 * Offline seek fallback: when the stream stalled mid-play and the player is
 * still bound to the network URL, a tap on the progress bar would seek a dead
 * player. If a retained partial download exists on disk, swap the source to it
 * and continue from the tapped position instead (issue #109).
 */
export const shouldSeekViaPartialSource = async (): Promise<boolean> => {
  if (ctx.get(isOnlineAtom)) return false
  const resolvedUrl = audioLoader.getLastResolvedUrl()
  if (!resolvedUrl || resolvedUrl.startsWith(CACHE_URI_PREFIX)) return false
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return false
  const partialUri = await getPartialFileUri(audioUrl)
  return partialUri !== null
}

/**
 * Swaps the stalled network source to the retained partial file at the tapped
 * position. Mirrors the resumeWithSourceSwap pattern: replaceAudio re-resolves
 * the source (the offline branch resolves the partial file://) and loads at
 * the position. Playback resumes only after a stall-induced auto-pause, not a
 * manual one.
 * @param sourceSwap - Player control actions used to swap the source and resume.
 * @param clampedPosition - Target position in milliseconds to continue from.
 */
export const seekViaPartialSource = async (
  sourceSwap: SeekSourceSwap,
  clampedPosition: number,
): Promise<void> => {
  seekGuard.arm()
  void setIsSeekingAction(ctx, true)
  void setSeekTargetAction(ctx, clampedPosition)
  void setPositionAction(ctx, clampedPosition)
  scheduleHistoryFlush(clampedPosition)
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return
  await sourceSwap.replaceAudio(audioUrl, clampedPosition)
  if (ctx.get(pauseTypeAtom) === 'auto') await sourceSwap.play()
}
