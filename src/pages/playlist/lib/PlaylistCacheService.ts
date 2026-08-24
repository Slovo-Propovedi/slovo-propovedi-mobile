import { type Ctx } from '@reatom/framework'
import { debugConfig } from 'shared/config'
import { playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { isCachingPlaylistAtom, playlistCacheErrorAtom } from '../model'
import { isNetworkError } from './isNetworkError'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'
import { runPlaylistCaching } from './runPlaylistCaching'

const log = debugConfig.enablePlaylistCacheLogs
  ? (...args: unknown[]) => console.log('[PlaylistCacheService]', ...args)
  : () => {}

export interface TrackToCache {
  audioUrl?: null | string
  id: string
  title: string
}

class PlaylistCacheService {
  public getError(): Error | null {
    return this.currentError
  }

  public clearError(): void {
    this.currentError = null
  }

  public async cachePlaylist(
    ctx: Ctx,
    tracks: TrackToCache[],
    playlistTitle: string,
  ): Promise<void> {
    if (tracks.length === 0) return

    if (ctx.get(isCachingPlaylistAtom)) return

    const tracksToCache = tracks.filter(
      (track): track is { audioUrl: string } & TrackToCache => track.audioUrl != null,
    )
    if (tracksToCache.length === 0) return

    try {
      isCachingPlaylistAtom(ctx, true)

      const failedCount = await runPlaylistCaching(ctx, tracksToCache, playlistTitle)

      if (failedCount > 0)
        await playlistCacheNotifications.showErrorNotification(
          new Error(`Не удалось скачать ${failedCount} из ${tracksToCache.length}`),
          playlistTitle,
        )
      else
        await playlistCacheNotifications.showCompletionNotification(
          tracksToCache.length,
          playlistTitle,
        )
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      log('Fatal error during caching:', error)

      if (!isNetworkError(errorObj)) {
        this.currentError = errorObj
        playlistCacheErrorAtom(ctx, errorObj)
      }

      await playlistCacheNotifications.showErrorNotification(errorObj, playlistTitle)
    } finally {
      isCachingPlaylistAtom(ctx, false)
      playlistDownloadProgressAtom(ctx, {})
    }
  }

  private currentError: Error | null = null
}

export const playlistCacheService = new PlaylistCacheService()
