import { type Ctx } from '@reatom/framework'
import { debugConfig } from 'shared/config'
import {
  activeCacheUrlAtom,
  cancelCacheDownload,
  getCacheRequesters,
  registerPlaylistRunStopper,
  removeFromQueueBySource,
  unregisterPlaylistRunStopper,
} from 'shared/lib/audio-cache'
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

    const controller = new AbortController()
    this.runController = controller
    // Register the run in the global stopper registry so «Остановить все
    // закачки» (cancelAllCacheDownloads) aborts this run too. FSD inversion:
    // the run (pages) registers its stopper into shared; the fullscreen
    // player's corner stop button (widgets) invokes it without importing pages.
    const stopper = () => controller.abort()
    registerPlaylistRunStopper(stopper)

    try {
      isCachingPlaylistAtom(ctx, true)

      const failedCount = await runPlaylistCaching(
        ctx,
        tracksToCache,
        playlistTitle,
        controller.signal,
      )
      if (controller.signal.aborted) return

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
      if (controller.signal.aborted) return

      const errorObj = error instanceof Error ? error : new Error(String(error))
      log('Fatal error during caching:', error)

      if (!isNetworkError(errorObj)) {
        this.currentError = errorObj
        playlistCacheErrorAtom(ctx, errorObj)
      }

      await playlistCacheNotifications.showErrorNotification(errorObj, playlistTitle)
    } finally {
      unregisterPlaylistRunStopper(stopper)
      removeFromQueueBySource(ctx, 'playlist')
      isCachingPlaylistAtom(ctx, false)
      this.runController = null
    }
  }

  public cancelPlaylistCache(ctx: Ctx): void {
    if (!ctx.get(isCachingPlaylistAtom)) return

    const activeUrl = ctx.get(activeCacheUrlAtom)
    if (activeUrl && isOnlyPlaylistRequester(activeUrl)) cancelCacheDownload(ctx, activeUrl)

    this.runController?.abort()
    removeFromQueueBySource(ctx, 'playlist')
  }

  private runController: AbortController | null = null
  private currentError: Error | null = null
}

const isOnlyPlaylistRequester = (url: string): boolean => {
  const requesters = getCacheRequesters(url)
  for (const source of requesters) if (source !== 'playlist') return false

  return true
}

export const playlistCacheService = new PlaylistCacheService()
