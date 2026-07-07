import { type Ctx } from '@reatom/framework'
import { debugConfig } from 'shared/config'
import { audioCacheService } from 'shared/lib/audio-cache'
import {
  cacheUpdateTriggerAtom,
  isCachingPlaylistAtom,
  playlistCacheErrorAtom,
  playlistCacheProgressAtom,
  playlistDownloadProgressAtom,
} from '../model'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'

const NETWORK_ERROR_PATTERNS = ['network', 'internet', 'Network request failed', 'ECONNREFUSED']

const log = debugConfig.enablePlaylistCacheLogs
  ? (...args: unknown[]) => console.log('[PlaylistCacheService]', ...args)
  : () => {}

export interface TrackToCache {
  audioUrl?: null | string
  id: string
  title: string
}

const isNetworkError = (error: Error): boolean => {
  const lowerMessage = error.message.toLowerCase()
  return NETWORK_ERROR_PATTERNS.some(pattern => lowerMessage.includes(pattern.toLowerCase()))
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

    let notificationId = ''
    let hasErrors = false

    try {
      isCachingPlaylistAtom(ctx, true)
      playlistCacheProgressAtom(ctx, {
        current: 0,
        total: tracksToCache.length,
      })

      notificationId = await playlistCacheNotifications.showCachingNotification(playlistTitle)

      for (const [index, track] of tracksToCache.entries()) {
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
        } catch (error) {
          hasErrors = true
          log(`Failed to cache "${track.title}" (${track.id}):`, error)
        }

        const current = index + 1
        playlistCacheProgressAtom(ctx, prev => ({
          ...prev,
          current,
        }))
        cacheUpdateTriggerAtom(ctx, prev => prev + 1)

        notificationId = await playlistCacheNotifications.updateCachingNotification(
          notificationId,
          current,
          tracksToCache.length,
          playlistTitle,
        )
      }

      if (hasErrors)
        await playlistCacheNotifications.showErrorNotification(
          new Error('Некоторые проповеди не удалось скачать'),
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
      if (notificationId) await playlistCacheNotifications.hideCachingNotification(notificationId)
      isCachingPlaylistAtom(ctx, false)
      playlistDownloadProgressAtom(ctx, {})
    }
  }

  private currentError: Error | null = null
}

export const playlistCacheService = new PlaylistCacheService()
