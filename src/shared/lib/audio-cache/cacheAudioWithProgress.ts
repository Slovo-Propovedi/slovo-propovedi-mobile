import { type Ctx } from '@reatom/framework'
import {
  markUrlCached,
  removeTrackDownloadProgress,
  setTrackDownloadProgress,
} from '../cache-triggers'
import { audioCacheService } from './AudioCacheService'

/**
 * Caches one track while reporting per-URL download progress through the shared
 * `playlistDownloadProgressAtom` (Issue #82 follow-up).
 *
 * Unified download protocol:
 * 1. Pre-set `0` before the download starts;
 * 2. Forward each `onProgress` tick from `audioCacheService.cacheAudio`;
 * 3. On success, mark the URL in the optimistic `cachedUrlsAtom` overlay BEFORE
 *    the progress entry is dropped, so the row transitions progress→cached with
 *    no intermediate 'cloud' frame;
 * 4. Drop the progress entry in `finally` — on success, on failure, and on the
 *    skip-cached path where `cacheAudio` resolves without ever calling `onProgress`.
 *
 * Rejections propagate to the caller.
 * Note: this helper does NOT increment `cacheUpdateTriggerAtom`. Registry write
 * happens here (markUrlCached); the playlist run no longer bumps the trigger —
 * UI updates flow purely through the overlay + progress + queue atoms.
 * @param ctx - Reatom context for atom updates.
 * @param audioUrl - Audio URL to cache.
 * @param onProgress - Optional extra progress callback (0..1) forwarded alongside
 * the per-URL atom writes (used by the queue runner to fan out to joiners).
 * @param signal - Optional signal that cancels the underlying download.
 * @returns The resolved local file URI from `audioCacheService.cacheAudio`.
 */
export const cacheAudioWithProgress = async (
  ctx: Ctx,
  audioUrl: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<string> => {
  setTrackDownloadProgress(ctx, { progress: 0, url: audioUrl })
  try {
    const uri = await audioCacheService.cacheAudio(
      audioUrl,
      progress => {
        setTrackDownloadProgress(ctx, { progress, url: audioUrl })
        onProgress?.(progress)
      },
      signal,
    )
    markUrlCached(ctx, audioUrl)
    return uri
  } finally {
    removeTrackDownloadProgress(ctx, audioUrl)
  }
}
