import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { startBackgroundCaching } from './BackgroundCachingService'

/**
 * Fire-and-forget: if the track is uncached and the user is online,
 * kick off background caching. Mirrors native AudioLoader.getPlaybackUrl
 * behavior. Does NOT block playback — streaming continues from the
 * network URL regardless.
 * @param audioUrl - Network URL of the track to (optionally) cache.
 */
export const autoCacheOnPlay = (audioUrl: string): void => {
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
