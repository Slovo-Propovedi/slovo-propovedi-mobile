import { audioCacheService, PART_SUFFIX } from 'entities/offline-cache/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { positionAtom } from '../../../model'
import { resolveEngineAudioUrl } from './resolveEngineAudioUrl'

interface SourceSwapPlayer {
  getCurrentSourceUri: () => null | string
  play: () => Promise<void>
  swapSource: (resolvedUrl: string, positionMs: number) => Promise<unknown>
}

const CACHE_URI_PREFIX = 'file://'

const isLocalFileUri = (sourceUrl: string): boolean => sourceUrl.startsWith(CACHE_URI_PREFIX)

const sourceAlreadyServesCache = (sourceUrl: null | string): boolean =>
  sourceUrl !== null && isLocalFileUri(sourceUrl) && !sourceUrl.endsWith(PART_SUFFIX)

/**
 * Resumes playback after pause, swapping the queue's current source to the
 * cached file when the background download finished after the track had
 * started streaming from the server (issue #107). Without the swap the native
 * queue stays bound to the dead server URI and pressing play silently fails
 * even though the track is already cached. A local PARTIAL uri (still
 * downloading) must also be swapped for the completed final file once the
 * download finishes.
 *
 * The swap is symmetric: the queue may also be bound to a cache file that is
 * GONE, and then it must be re-resolved too. Disabling sermon caching wipes the
 * cache directory under the running queue, leaving it pointing at a deleted
 * `file://` source — a bare play silently does nothing. Rebinding through
 * `swapSource` re-resolves the source and keeps the current position.
 * @param player - Queue control actions used to swap the source and resume.
 * @param requestedAudioUrl - Network URL of the track being resumed. The native
 * queue is the source of truth: when it already sits on another track (the async
 * switch gap left a stale atom URL), its current track URL is used instead so a
 * cached file of the previous track is never swapped into the live slot.
 */
export const resumeWithSourceSwap = async (
  player: SourceSwapPlayer,
  requestedAudioUrl: string,
): Promise<void> => {
  const audioUrl = resolveEngineAudioUrl(requestedAudioUrl)
  let cachedUri: null | string = null
  try {
    cachedUri = await audioCacheService.getCachedUri(audioUrl)
  } catch (error) {
    console.error('[resumeWithSourceSwap] cache check failed:', error)
  }

  const isTrackCached = cachedUri !== null
  const isPlayerBoundToCache = sourceAlreadyServesCache(player.getCurrentSourceUri())

  // Agreement means the bound source still exists — the file is there, or no
  // cache is involved at all. Anything else needs a re-resolve.
  if (isTrackCached === isPlayerBoundToCache) return player.play()

  await player.swapSource(cachedUri ?? audioUrl, ctx.get(positionAtom))
  return player.play()
}
