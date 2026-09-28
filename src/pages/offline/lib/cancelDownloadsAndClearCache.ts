import { type Ctx } from '@reatom/framework'
import {
  cancelAllCacheDownloads,
  clearAudioCacheAction,
  waitForInflightCacheDownloads,
} from 'entities/offline-cache'

/**
 * Turning sermon caching off must free device storage even mid-download: the
 * queue is drained and the active download aborted FIRST, then the aborted
 * download is awaited, and only then the cache is cleared.
 *
 * Awaiting the in-flight download promises (not polling with a ceiling) makes
 * the clear unconditional: even in the rare Android race where the cancel is a
 * no-op and the runaway download runs to completion, we wait for it and clear
 * afterwards. The queue gates are inert (the setting atom flipped first), so no
 * new download can start between the cancel and the clear.
 * @param ctx - Reatom context.
 * @returns True when the cache directory ended up cleared, and false if the clear failed.
 */
export const cancelDownloadsAndClearCache = async (ctx: Ctx): Promise<boolean> => {
  await cancelAllCacheDownloads(ctx)
  await waitForInflightCacheDownloads()

  const result = await clearAudioCacheAction(ctx)
  if (!result.success)
    console.warn('[offline] Audio cache was not cleared after disabling caching:', result)

  return result.success
}
