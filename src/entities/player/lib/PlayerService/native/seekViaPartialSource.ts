import { audioCacheService, getPartialFileUri, PART_SUFFIX } from 'shared/lib/audio-cache'
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

/** Offline seek fallback: swap the stalled network source to the retained partial file (issue #109). */
export const shouldSeekViaPartialSource = async (): Promise<null | string> => {
  if (ctx.get(isOnlineAtom)) return null
  const resolvedUrl = audioLoader.getLastResolvedUrl()
  if (!resolvedUrl || resolvedUrl.startsWith(CACHE_URI_PREFIX)) return null
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return null
  const partialUri = await getPartialFileUri(audioUrl)
  return partialUri === null ? null : audioUrl
}

/** Seek swap for a loaded partial: swap to the completed cached file at the target position (issue #109). */
export const shouldSwapPartialForCachedSeek = async (): Promise<null | string> => {
  const resolvedUrl = audioLoader.getLastResolvedUrl()
  if (!resolvedUrl?.endsWith(PART_SUFFIX)) return null
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return null
  const cached = await audioCacheService.isCached(audioUrl)
  // Race guard: the track may have switched while the cache was being checked.
  if (!cached || ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return null
  return audioUrl
}

const armSeekSwap = (clampedPosition: number): void => {
  seekGuard.arm()
  void setIsSeekingAction(ctx, true)
  void setSeekTargetAction(ctx, clampedPosition)
  void setPositionAction(ctx, clampedPosition)
  scheduleHistoryFlush(clampedPosition)
}
const handleSeekSwapFailure = (error: unknown, tag: string): void => {
  console.error(`${tag} source swap failed:`, error)
  reportError(error, 'Ошибка при перемотке аудио')
  seekGuard.clear()
  void setIsSeekingAction(ctx, false)
  void setSeekTargetAction(ctx, null)
}

/**
 * Swaps the stalled network source to the retained partial file at the tapped
 * position.
 * @param sourceSwap - Player control actions used to swap the source and resume.
 * @param audioUrl - Vetted network URL of the track to swap.
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
  armSeekSwap(clampedPosition)
  try {
    await sourceSwap.replaceAudio(audioUrl, clampedPosition)
    if (shouldResume) await sourceSwap.play()
  } catch (error) {
    handleSeekSwapFailure(error, '[seekViaPartialSource]')
  }
}

/**
 * Swaps the loaded partial source to the completed cached file at the target
 * position.
 * @param sourceSwap - Player control actions used to swap the source and resume.
 * @param audioUrl - Vetted network URL of the track to swap.
 * @param clampedPosition - Target position in milliseconds to continue from.
 */
export const swapPartialForCachedSeek = async (
  sourceSwap: SeekSourceSwap,
  audioUrl: string,
  clampedPosition: number,
): Promise<void> => {
  if (ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return
  const wasPlaying = ctx.get(isPlayingAtom)
  armSeekSwap(clampedPosition)
  try {
    await sourceSwap.replaceAudio(audioUrl, clampedPosition)
    if (wasPlaying) await sourceSwap.play()
  } catch (error) {
    handleSeekSwapFailure(error, '[swapPartialForCachedSeek]')
  }
}

/**
 * Combined seek-swap decision: tries the offline partial fallback first, then
 * the partial→cached swap, and executes the applicable path.
 * @param sourceSwap - Player control actions used to swap the source and resume.
 * @param clampedPosition - Target position in milliseconds to continue from.
 */
export const seekWithSourceSwap = async (
  sourceSwap: SeekSourceSwap,
  clampedPosition: number,
): Promise<boolean> => {
  const partialAudioUrl = await shouldSeekViaPartialSource()
  if (partialAudioUrl) {
    await seekViaPartialSource(sourceSwap, partialAudioUrl, clampedPosition)
    return true
  }
  const cachedAudioUrl = await shouldSwapPartialForCachedSeek()
  if (cachedAudioUrl) {
    await swapPartialForCachedSeek(sourceSwap, cachedAudioUrl, clampedPosition)
    return true
  }
  return false
}
