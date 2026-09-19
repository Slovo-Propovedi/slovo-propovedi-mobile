import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import {
  currentAudioAtom,
  setIsSeekingAction,
  setPositionAction,
  setSeekTargetAction,
} from '../../../model'
import { scheduleHistoryFlush } from '../progressFlusher'
import { type SeekSourceSwap } from '../types'
import { seekGuard } from './SeekGuard'

export const armSeekSwap = (clampedPosition: number): void => {
  seekGuard.arm()
  void setIsSeekingAction(ctx, true)
  void setSeekTargetAction(ctx, clampedPosition)
  void setPositionAction(ctx, clampedPosition)
  scheduleHistoryFlush(clampedPosition)
}
export const handleSeekSwapFailure = (error: unknown, tag: string): void => {
  console.error(`${tag} source swap failed:`, error)
  reportError(error, 'Ошибка при перемотке аудио')
  seekGuard.clear()
  void setIsSeekingAction(ctx, false)
  void setSeekTargetAction(ctx, null)
}

/**
 * Swaps the player source at the tapped position and resumes when requested.
 * @param sourceSwap - Player control actions used to swap the source and resume.
 * @param audioUrl - Vetted network URL of the track to swap.
 * @param clampedPosition - Target position in milliseconds to continue from.
 * @param resumePlayback - Whether playback should continue after the swap.
 * @param logTag - Tag used to identify the swap path in failure logs.
 */
export const swapSourceForSeek = async (
  sourceSwap: SeekSourceSwap,
  audioUrl: string,
  clampedPosition: number,
  resumePlayback: boolean,
  logTag: string,
): Promise<void> => {
  // Race guard: the track may have switched while the source was being
  // resolved — never swap the new track at the old track's target.
  if (ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return
  armSeekSwap(clampedPosition)
  try {
    await sourceSwap.replaceAudio(audioUrl, clampedPosition)
    if (resumePlayback) await sourceSwap.play()
  } catch (error) {
    handleSeekSwapFailure(error, logTag)
  }
}
