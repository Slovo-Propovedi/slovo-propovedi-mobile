import { type Ctx } from '@reatom/framework'
import { removeTrackDownloadProgress, setTrackDownloadProgress } from '../cache-triggers'
import { audioCacheService } from './AudioCacheService'

/**
 * Caches one track while reporting per-URL download progress through the shared
 * `playlistDownloadProgressAtom` (Issue #82 follow-up).
 *
 * Unified download protocol:
 * 1. Pre-set `0` before the download starts;
 * 2. Forward each `onProgress` tick from `audioCacheService.cacheAudio`;
 * 3. Drop the progress entry in `finally` — on success, on failure, and on the
 *    skip-cached path where `cacheAudio` resolves without ever calling `onProgress`.
 *
 * Rejections propagate to the caller.
 * Note: this helper does NOT increment `cacheUpdateTriggerAtom`.
 * Trigger policy stays with callers (row hook / fullscreen handler / playlist
 * runner increment on success; BackgroundCachingService keeps its own path).
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
    return await audioCacheService.cacheAudio(
      audioUrl,
      progress => {
        setTrackDownloadProgress(ctx, { progress, url: audioUrl })
        onProgress?.(progress)
      },
      signal,
    )
  } finally {
    removeTrackDownloadProgress(ctx, audioUrl)
  }
}
