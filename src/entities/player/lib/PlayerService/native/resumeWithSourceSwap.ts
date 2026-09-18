import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { positionAtom } from '../../../model'
import { audioLoader } from './AudioLoader'

interface SourceSwapPlayer {
  play: () => Promise<void>
  replaceAudio: (audioUrl: string, initialPositionMs: number) => Promise<unknown>
}

const CACHE_URI_PREFIX = 'file://'

const isLocalFileUri = (sourceUrl: string): boolean => sourceUrl.startsWith(CACHE_URI_PREFIX)

const sourceAlreadyServesCache = (sourceUrl: null | string): boolean =>
  sourceUrl !== null && isLocalFileUri(sourceUrl)

/**
 * Resumes playback after pause, swapping the player source to the cached file
 * when the background download finished after the track had started streaming
 * from the server (issue #107). Without the swap the AudioPlayer stays bound
 * to the dead server URI and pressing play silently fails even though the
 * track is already cached.
 * @param player - Player control actions used to swap the source and resume.
 * @param audioUrl - Network URL of the track being resumed. Always pass the original server URL —
 * replaceAudio re-resolves it through AudioLoader.getPlaybackUrl; passing a resolved file:// URI
 * would miss the cache key and enqueue a bogus re-download.
 */
export const resumeWithSourceSwap = async (
  player: SourceSwapPlayer,
  audioUrl: string,
): Promise<void> => {
  let cachedUri: null | string = null
  try {
    cachedUri = await audioCacheService.getCachedUri(audioUrl)
  } catch (error) {
    console.error('[resumeWithSourceSwap] cache check failed:', error)
  }
  if (!cachedUri) return player.play()

  if (sourceAlreadyServesCache(audioLoader.getLastResolvedUrl())) return player.play()

  await player.replaceAudio(audioUrl, ctx.get(positionAtom))
  return player.play()
}
