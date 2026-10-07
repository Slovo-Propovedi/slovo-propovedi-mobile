import z from 'zod'
import { type PlaylistData, playlistDataSchema } from 'entities/playlist'
import { CACHED_PLAYLIST_SEARCH, CACHED_PLAYLIST_SEARCH_INDEX } from 'shared/config'
import { createQueryCache } from 'shared/lib/cache'

const MAX_CACHED_SEARCH_QUERIES = 30

const playlistsArraySchema = z.array(playlistDataSchema)

const playlistSearchCache = createQueryCache({
  indexKey: CACHED_PLAYLIST_SEARCH_INDEX,
  label: 'Playlist search',
  maxEntries: MAX_CACHED_SEARCH_QUERIES,
  prefix: CACHED_PLAYLIST_SEARCH,
  schema: playlistsArraySchema,
})

/**
 * Reads cached playlist search results for a query.
 * @param query - Search query (normalized internally).
 */
export const getCachedPlaylistSearch = (query: string): Promise<PlaylistData[] | undefined> =>
  playlistSearchCache.get(query)

/**
 * Persists playlist search results for a query.
 * Never rejects: failures are caught and logged inside the write queue;
 * callers' `.catch` is a safety net only.
 * @param query - Normalized search query (trimmed, lowercased).
 * @param playlists - Results to cache; empty arrays are skipped.
 */
export const setCachedPlaylistSearch = (query: string, playlists: PlaylistData[]): Promise<void> =>
  playlistSearchCache.set(query, playlists)
