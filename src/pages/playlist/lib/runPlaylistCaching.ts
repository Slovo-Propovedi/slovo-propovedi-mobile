import { type Ctx } from '@reatom/framework'
import { enqueueCache, isCacheCancelledError } from 'shared/lib/audio-cache'
import { incrementCacheTrigger } from 'shared/lib/cache-triggers'
import { waitForOnline } from 'shared/lib/network'
import { playlistCacheProgressAtom } from '../model'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'

const WAIT_ONLINE_BEFORE_TRACK_MS = 60_000
export const NETWORK_LOST_MESSAGE = 'Нет подключения к интернету'

interface CacheableTrack {
  audioUrl: string
  id: string
  title: string
}

/**
 * Caches a playlist through the global serial queue: enqueues every track
 * upfront (FIFO), then awaits each per-URL promise in order. A cancelled track
 * (CacheCancelledError) is skipped; a cancelled run breaks the loop early.
 * @param ctx - Reatom context for atom updates.
 * @param tracks - Tracks with a non-null audioUrl to cache.
 * @param playlistTitle - Playlist title used in notification texts.
 * @param signal - Abort signal of the run; checked after every await.
 * @returns How many tracks failed to cache.
 * @throws {Error} With NETWORK_LOST_MESSAGE when the device stays offline.
 */
export const runPlaylistCaching = async (
  ctx: Ctx,
  tracks: CacheableTrack[],
  playlistTitle: string,
  signal: AbortSignal,
): Promise<number> => {
  let failedCount = 0

  playlistCacheProgressAtom(ctx, { current: 0, total: tracks.length })
  let notificationId = await playlistCacheNotifications.showCachingNotification(playlistTitle)

  // A global stop during the notification window must not enqueue anything:
  // the loop-top abort check below then exits on the first iteration.
  const promises = signal.aborted
    ? []
    : tracks.map(track => enqueueCache(ctx, track.audioUrl, 'playlist'))

  try {
    for (const [index] of tracks.entries()) {
      if (signal.aborted) break
      const online = await waitForOnline(WAIT_ONLINE_BEFORE_TRACK_MS, signal)
      if (signal.aborted) break
      if (!online) throw new Error(NETWORK_LOST_MESSAGE)

      try {
        await promises[index]
      } catch (error) {
        if (isCacheCancelledError(error)) continue
        failedCount++
      }
      if (signal.aborted) break

      const current = index + 1
      playlistCacheProgressAtom(ctx, prev => ({ ...prev, current }))
      incrementCacheTrigger(ctx)
      notificationId = await playlistCacheNotifications.updateCachingNotification(
        notificationId,
        current,
        tracks.length,
        playlistTitle,
      )
    }
  } finally {
    await playlistCacheNotifications.hideCachingNotification(notificationId)
  }

  return failedCount
}
