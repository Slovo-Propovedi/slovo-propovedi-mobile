import { getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import {
  currentAudioAtom,
  isPlayingAtom,
  setIsSeekingAction,
  setPositionAction,
  setSeekTargetAction,
} from '../../../model'
import { isStalledOfflineAtom } from '../../stalledOffline'
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
 * @returns The vetted network audioUrl to swap to, or null when the swap path
 * must not run (online, already-local source, no current track, no partial).
 */
export const shouldSeekViaPartialSource = async (): Promise<null | string> => {
  if (ctx.get(isOnlineAtom)) return null
  const resolvedUrl = audioLoader.getLastResolvedUrl()
  if (!resolvedUrl || resolvedUrl.startsWith(CACHE_URI_PREFIX)) return null
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return null
  const partialUri = await getPartialFileUri(audioUrl)
  return partialUri === null ? null : audioUrl
}

/**
 * Swaps the stalled network source to the retained partial file at the tapped
 * position. Mirrors the resumeWithSourceSwap pattern: replaceAudio re-resolves
 * the source (the offline branch resolves the partial file://) and loads at
 * the position. Playback resumes when the track was playing or paused by the
 * stall; a manual pause stays paused.
 * @param sourceSwap - Player control actions used to swap the source and resume.
 * @param audioUrl - Vetted network URL of the track to swap (from shouldSeekViaPartialSource).
 * @param clampedPosition - Target position in milliseconds to continue from.
 */
export const seekViaPartialSource = async (
  sourceSwap: SeekSourceSwap,
  audioUrl: string,
  clampedPosition: number,
): Promise<void> => {
  // Race guard: the track may have switched while the partial URI was being
  // resolved — never swap the new track at the old track's target.
  if (ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return
  const wasPlaying = ctx.get(isPlayingAtom)
  const stalledOffline = ctx.get(isStalledOfflineAtom)
  const shouldResume = wasPlaying || stalledOffline
  seekGuard.arm()
  try {
    void setIsSeekingAction(ctx, true)
    void setSeekTargetAction(ctx, clampedPosition)
    void setPositionAction(ctx, clampedPosition)
    scheduleHistoryFlush(clampedPosition)
    await sourceSwap.replaceAudio(audioUrl, clampedPosition)
    if (shouldResume) await sourceSwap.play()
  } catch (error) {
    console.error('[seekViaPartialSource] source swap failed:', error)
    reportError(error, 'Ошибка при перемотке аудио')
    seekGuard.clear()
    void setIsSeekingAction(ctx, false)
    void setSeekTargetAction(ctx, null)
  }
}
