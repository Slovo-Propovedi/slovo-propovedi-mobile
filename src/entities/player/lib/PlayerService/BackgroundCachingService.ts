import { enqueueCache, isCacheCancelledError } from 'shared/lib/audio-cache'
import { incrementCacheTrigger } from 'shared/lib/cache-triggers'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  downloadingAudioUrlAtom,
  setDownloadingUrlAction,
  setDownloadProgressAction,
  setIsDownloadingAction,
} from '../download-model'

/**
 * Kicks off background caching of a track through the global serial queue.
 * The queue guarantees «не более одной активной закачки» app-wide; BCS only
 * mirrors download progress into the global downloader atoms. Global atoms are
 * written lazily on the first progress tick (M5) — enqueueing alone must not
 * claim the downloader state while the URL waits in the queue.
 * @param audioUrl - Network URL of the track to cache.
 */
export const startBackgroundCaching = (audioUrl: string): void => {
  if (!audioUrl) return

  let claimed = false
  void enqueueCache(ctx, audioUrl, 'auto', progress => {
    // Claim the downloader state on the first tick only. A late tick after a
    // newer downloader claimed the state must neither steal it back nor write
    // progress.
    if (!claimed && ctx.get(downloadingAudioUrlAtom) !== audioUrl) {
      claimed = true
      void setIsDownloadingAction(ctx, true)
      void setDownloadingUrlAction(ctx, audioUrl)
    }
    if (ctx.get(downloadingAudioUrlAtom) === audioUrl) void setDownloadProgressAction(ctx, progress)
  })
    .then(() => {
      void incrementCacheTrigger(ctx)
      if (ctx.get(downloadingAudioUrlAtom) === audioUrl) void setDownloadProgressAction(ctx, 1)
    })
    .catch(error => {
      // Background caching is an automatic, invisible optimization (Issue #73):
      // playback streams from network and is unaffected; a network error must
      // not open the global error dialog. Next playback re-triggers caching.
      if (isCacheCancelledError(error))
        console.warn('[BackgroundCaching] Caching cancelled:', error)
      else console.error('[BackgroundCaching] Caching failed:', error)
    })
    .finally(() => {
      if (ctx.get(downloadingAudioUrlAtom) === audioUrl) {
        void setIsDownloadingAction(ctx, false)
        void setDownloadingUrlAction(ctx, null)
      }
    })
}
