import { audioCacheService, PART_SUFFIX } from 'entities/offline-cache/@x/player'
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
  sourceUrl !== null && isLocalFileUri(sourceUrl) && !sourceUrl.endsWith(PART_SUFFIX)

/**
 * Resumes playback after pause, swapping the player source to the cached file
 * when the background download finished after the track had started streaming
 * from the server (issue #107). Without the swap the AudioPlayer stays bound
 * to the dead server URI and pressing play silently fails even though the
 * track is already cached. A local PARTIAL uri (still downloading) must also
 * be swapped for the completed final file once the download finishes.
 *
 * The swap is symmetric: the player may also be bound to a cache file that is
 * GONE, and then it must be re-resolved too. Disabling sermon caching wipes the
 * cache directory under the running player, leaving it pointing at a deleted
 * `file://` source — `PlaybackController.play` returns early on the resulting
 * unloaded instance, so a bare play silently does nothing. Rebinding through
 * `replaceAudio` re-runs `AudioLoader` → `resolvePlaybackUrl`, which with caching
 * off yields the network URL, and `AudioLoader.replaceAudio` overwrites
 * `lastResolvedUrl` — the stale memo cannot outlive the rebind.
 * @param player - Player control actions used to swap the source and resume.
 * @param audioUrl - Network URL of the track being resumed. Always pass the original server URL —
 * replaceAudio re-resolves it through AudioLoader → resolvePlaybackUrl; passing a resolved file:// URI
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

  const isTrackCached = cachedUri !== null
  const isPlayerBoundToCache = sourceAlreadyServesCache(audioLoader.getLastResolvedUrl())

  // Agreement means the source the player is bound to still exists — the file is
  // there, or no cache is involved at all. Anything else is a mismatch that only a
  // re-resolve can fix.
  if (isTrackCached === isPlayerBoundToCache) return player.play()

  await player.replaceAudio(audioUrl, ctx.get(positionAtom))
  return player.play()
}
