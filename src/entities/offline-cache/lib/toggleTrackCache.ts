import { type Ctx } from '@reatom/framework'
import { markUrlEvicted } from '../model'
import { removeFromCache } from './AudioCacheService'
import { isCacheCancelledError } from './CacheCancelledError'
import { cancelCacheDownload } from './cacheQueue'
import { enqueueCache } from './cacheQueueEnqueue'

interface ToggleTrackCacheInput {
  audioUrl: null | string | undefined
  ctx: Ctx
  isCached: boolean
  isDownloading: boolean
  isOnline: boolean
  isQueued: boolean
  isSermonCachingEnabled: boolean
  onCacheChanged: () => void
}

/**
 * Per-row cache action behind the offline toggle: cancel (downloading/queued) →
 * remove (cached) → enqueue (cloud). A no-op while sermon caching is disabled
 * (setting `sermon_caching_enabled`), for a row without an audio URL, and for
 * the cloud branch while offline. Cancel/remove work offline — they need no
 * network.
 * @param input - Resolved row state plus the `onCacheChanged` refresh callback.
 * @param input.audioUrl - Track audio URL; a falsy URL makes the call a no-op.
 * @param input.ctx - Reatom context for queue/registry atom updates.
 * @param input.isCached - Whether the file is already in the audio cache.
 * @param input.isDownloading - Whether a download is actively writing the file.
 * @param input.isOnline - Network reachability; gates only the enqueue branch.
 * @param input.isQueued - Whether the URL waits in the global cache queue.
 * @param input.isSermonCachingEnabled - The `sermon_caching_enabled` setting.
 * @param input.onCacheChanged - Re-checks the row's cache state after a change.
 */
export const toggleTrackCache = async ({
  audioUrl,
  ctx,
  isCached,
  isDownloading,
  isOnline,
  isQueued,
  isSermonCachingEnabled,
  onCacheChanged,
}: ToggleTrackCacheInput): Promise<void> => {
  if (!isSermonCachingEnabled) return
  if (!audioUrl) return

  // Cancel: active download or queued — cancel unconditionally.
  if (isDownloading || isQueued) {
    cancelCacheDownload(ctx, audioUrl)
    return
  }

  // Remove from cache.
  if (isCached) {
    try {
      await removeFromCache(audioUrl)
      markUrlEvicted(ctx, audioUrl)
      onCacheChanged()
    } catch (error) {
      console.warn('[toggleTrackCache] Error removing from cache:', error)
    }
    return
  }

  // Cloud → enqueue (don't block on download).
  if (!isOnline) return
  void enqueueCache(ctx, audioUrl, 'manual')
    .then(() => {
      onCacheChanged()
    })
    .catch(error => {
      if (!isCacheCancelledError(error))
        console.warn('[toggleTrackCache] Error enqueuing cache:', error)
    })
}
