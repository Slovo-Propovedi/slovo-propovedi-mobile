import { audioCacheService, getPartialFileUri, PART_SUFFIX } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom, isPlayingAtom } from '../../../model'
import { isStalledOfflineAtom } from '../../stalledOffline'
import { type SeekSourceSwap } from '../types'
import { audioLoader } from './AudioLoader'
import { swapSourceForSeek } from './seekSourceSwapCore'
import {
  shouldSwapPartialForNetworkSeek,
  swapPartialForNetworkSeek,
} from './swapPartialForNetworkSeek'

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
  const wasPlaying = ctx.get(isPlayingAtom)
  const stalledOffline = ctx.get(isStalledOfflineAtom)
  const shouldResume = wasPlaying || stalledOffline
  await swapSourceForSeek(
    sourceSwap,
    audioUrl,
    clampedPosition,
    shouldResume,
    '[seekViaPartialSource]',
  )
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
  const wasPlaying = ctx.get(isPlayingAtom)
  await swapSourceForSeek(
    sourceSwap,
    audioUrl,
    clampedPosition,
    wasPlaying,
    '[swapPartialForCachedSeek]',
  )
}

/**
 * Combined seek-swap decision: tries the offline partial fallback first, then
 * the partial→cached swap, then the partial→network swap, and executes the
 * applicable path.
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
  const networkAudioUrl = await shouldSwapPartialForNetworkSeek()
  if (networkAudioUrl) {
    await swapPartialForNetworkSeek(sourceSwap, networkAudioUrl, clampedPosition)
    return true
  }
  return false
}
