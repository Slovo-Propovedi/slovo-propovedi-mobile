import { audioCacheService, sermonCachingEnabledAtom } from 'entities/offline-cache/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { startBackgroundCaching } from '../BackgroundCachingService'

/**
 * Fire-and-forget: if the track is uncached and the user is online,
 * kick off background caching. Mirrors native AudioLoader.getPlaybackUrl
 * behavior. Does NOT block playback — streaming continues from the
 * network URL regardless.
 * @param audioUrl - Network URL of the track to (optionally) cache.
 */
export const autoCacheOnPlay = (audioUrl: string): void => {
  // Caching off (Issue #77): skip the isCached disk lookup too — nothing would
  // be cached afterwards, and startBackgroundCaching bails out as well.
  if (!ctx.get(sermonCachingEnabledAtom)) return

  audioCacheService
    .isCached(audioUrl)
    .then(isCached => {
      if (isCached) return
      if (!ctx.get(isOnlineAtom)) return
      startBackgroundCaching(audioUrl)
    })
    .catch(() => {
      /* cache check failure is non-fatal — playback continues from network */
    })
}
