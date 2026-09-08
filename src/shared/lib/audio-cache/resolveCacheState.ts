export interface ResolveCacheStateInput {
  isCached: boolean
  isDownloading: boolean
  isPlaying: boolean
  isQueued: boolean
}

/**
 * Resolves the visual state of a track's cache status for rendering icons
 * and context menus.
 *
 * Precedence (highest → lowest):
 *   playing → downloading → cached → queued → cloud.
 *
 * Cached beats queued because enqueueCache deduplicates by queued/inflight
 * status, NOT by cached — a "cache all" sweep re-enqueues already-cached URLs.
 * When both flags are true the track IS cached and the queue entry is
 * redundant, so the row must present as cached (no clock, "Удалить из кеша").
 */
export type TrackCacheVisualState = 'cached' | 'cloud' | 'downloading' | 'playing' | 'queued'

export const resolveCacheState = (input: ResolveCacheStateInput): TrackCacheVisualState => {
  if (input.isPlaying) return 'playing'
  if (input.isDownloading) return 'downloading'
  if (input.isCached) return 'cached'
  if (input.isQueued) return 'queued'
  return 'cloud'
}
