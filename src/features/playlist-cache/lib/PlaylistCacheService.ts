import { type Ctx } from '@reatom/framework'
import { audioCacheService } from 'shared/lib/audio-cache'
import {
  cacheUpdateTriggerAtom,
  isCachingPlaylistAtom,
  playlistCacheProgressAtom,
  playlistDownloadProgressAtom,
} from '../model'

export interface TrackToCache {
  audioUrl?: null | string
  id: string
  title: string
}

class PlaylistCacheService {
  public async cachePlaylist(ctx: Ctx, tracks: TrackToCache[]): Promise<void> {
    // Early exit: no tracks provided
    if (tracks.length === 0) return

    // Guard clause: prevent concurrent caching (race condition)
    if (ctx.get(isCachingPlaylistAtom)) {
      console.warn('[PlaylistCacheService] Already caching a playlist, skipping')
      return
    }

    // Parse: keep only tracks with audio URLs
    const tracksToCache = tracks.filter(
      (track): track is { audioUrl: string } & TrackToCache => track.audioUrl != null,
    )
    if (tracksToCache.length === 0) {
      console.warn('[PlaylistCacheService] No tracks with audio URLs to cache')
      return
    }

    try {
      isCachingPlaylistAtom(ctx, true)
      playlistCacheProgressAtom(ctx, {
        current: 0,
        total: tracksToCache.length,
      })

      for (const track of tracksToCache) {
        try {
          // Set initial progress to 0 before starting the download
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
          console.error(
            `[PlaylistCacheService] Failed to cache "${track.title}" (${track.id}):`,
            error,
          )
        }

        playlistCacheProgressAtom(ctx, prev => ({
          ...prev,
          current: prev.current + 1,
        }))
        cacheUpdateTriggerAtom(ctx, prev => prev + 1)
      }
    } finally {
      // Ensure the caching flag and per-track progress are always reset, even on unexpected errors
      isCachingPlaylistAtom(ctx, false)
      playlistDownloadProgressAtom(ctx, {})
    }
  }
}

export const playlistCacheService = new PlaylistCacheService()
