import { audioCacheService, PART_SUFFIX } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom, isPlayingAtom } from '../../../model'
import { type SeekSourceSwap } from '../types'
import { audioLoader } from './AudioLoader'
import { swapSourceForSeek } from './seekSourceSwapCore'

/** Online seek past the partial: swap to the network stream while the download continues (issue #109). */
export const shouldSwapPartialForNetworkSeek = async (): Promise<null | string> => {
  const resolvedUrl = audioLoader.getLastResolvedUrl()
  if (!resolvedUrl?.endsWith(PART_SUFFIX)) return null
  if (!ctx.get(isOnlineAtom)) return null
  const audioUrl = ctx.get(currentAudioAtom)?.audioUrl
  if (!audioUrl) return null
  if (await audioCacheService.isCached(audioUrl)) return null
  // Race guard: the track may have switched while the cache was being checked.
  if (ctx.get(currentAudioAtom)?.audioUrl !== audioUrl) return null
  return audioUrl
}

/**
 * Swaps the loaded partial source to the network stream at the target position
 * while the background download continues.
 * @param sourceSwap - Player control actions used to swap the source and resume.
 * @param audioUrl - Vetted network URL of the track to swap.
 * @param clampedPosition - Target position in milliseconds to continue from.
 */
export const swapPartialForNetworkSeek = async (
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
    '[swapPartialForNetworkSeek]',
  )
}
