import { type Ctx } from '@reatom/framework'
import { debugConfig } from 'shared/config'
import { audioCacheService } from 'shared/lib/audio-cache'
import { cacheUpdateTriggerAtom, playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { waitForOnline } from 'shared/lib/network'
import { playlistCacheProgressAtom } from '../model'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'

const WAIT_ONLINE_BEFORE_TRACK_MS = 60_000
export const NETWORK_LOST_MESSAGE = 'Нет подключения к интернету'

const log = debugConfig.enablePlaylistCacheLogs
  ? (...args: unknown[]) => console.log('[PlaylistCacheService]', ...args)
  : () => {}

interface CacheableTrack {
  audioUrl: string
  id: string
  title: string
}

/**
 * Downloads one track, reporting per-URL progress.
 * @param ctx - Reatom context for atom updates.
 * @param track - Track to download.
 * @returns True on success, false when the download failed.
 */
const cacheSingleTrack = async (ctx: Ctx, track: CacheableTrack): Promise<boolean> => {
  try {
    playlistDownloadProgressAtom(ctx, prev => ({
      ...prev,
      [track.audioUrl]: 0,
    }))

    await audioCacheService.cacheAudio(track.audioUrl, (progress: number) => {
      playlistDownloadProgressAtom(ctx, prev => ({
        ...prev,
        [track.audioUrl]: progress,
      }))
    })
    return true
  } catch (error) {
    log(`Failed to cache "${track.title}" (${track.id}):`, error)
    return false
  }
}

/**
 * Sequentially caches every track, updating progress atoms and the caching
 * notification. Aborts the whole run when connectivity is lost before a track.
 * @param ctx - Reatom context for atom updates.
 * @param tracks - Tracks with a non-null audioUrl to cache.
 * @param playlistTitle - Playlist title used in notification texts.
 * @returns How many tracks failed to cache.
 * @throws {Error} With NETWORK_LOST_MESSAGE when the device stays offline.
 */
export const runPlaylistCaching = async (
  ctx: Ctx,
  tracks: CacheableTrack[],
  playlistTitle: string,
): Promise<number> => {
  let failedCount = 0

  playlistCacheProgressAtom(ctx, { current: 0, total: tracks.length })
  let notificationId = await playlistCacheNotifications.showCachingNotification(playlistTitle)

  try {
    for (const [index, track] of tracks.entries()) {
      const online = await waitForOnline(WAIT_ONLINE_BEFORE_TRACK_MS)
      if (!online) throw new Error(NETWORK_LOST_MESSAGE)

      const succeeded = await cacheSingleTrack(ctx, track)
      if (!succeeded) failedCount++

      const current = index + 1
      playlistCacheProgressAtom(ctx, prev => ({ ...prev, current }))
      cacheUpdateTriggerAtom(ctx, prev => prev + 1)
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
