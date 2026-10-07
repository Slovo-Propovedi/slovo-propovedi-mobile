import { mapPlaylistEntityToPlaylistData, type PlaylistData } from 'entities/playlist'
import { mapAllSermonsResponse, type SermonData } from 'entities/sermon'
import { playlistsApi, sermonsApi } from 'shared/api'
import { getCachedPlaylistSearch, setCachedPlaylistSearch } from './playlistSearchCache'
import { getCachedSearchResults, setCachedSearchResults } from './searchCache'

const SEARCH_TAKE = 20
const PLAYLIST_SEARCH_LIMIT = 50

export interface SearchFetchResult<T> {
  data: T
  fromNetwork: boolean
}

/**
 * Fetches sermons with an offline fallback to the per-query cache. Never rejects.
 * @param query - Trimmed search query.
 * @param take - Maximum number of sermons requested (compact search uses 20, full results 100).
 */
export const fetchSermonResults = async (
  query: string,
  take: number = SEARCH_TAKE,
): Promise<SearchFetchResult<SermonData[]>> => {
  try {
    const response = await sermonsApi.getSermons().sermonControllerFindAll({
      search: query,
      take,
    })
    return { data: mapAllSermonsResponse(response), fromNetwork: true }
  } catch (error) {
    console.error('fetchSearchResults network failed:', error)
    try {
      return { data: (await getCachedSearchResults(query)) ?? [], fromNetwork: false }
    } catch (cacheError) {
      console.error('Search cache read failed:', cacheError)
      return { data: [], fromNetwork: false }
    }
  }
}

/**
 * Fetches playlists by title/description with an offline fallback to the per-query cache.
 * @param query - Trimmed search query.
 * @param limit - Page size requested (compact search uses 50, full results 100).
 */
export const fetchPlaylistTitleMatches = async (
  query: string,
  limit: number = PLAYLIST_SEARCH_LIMIT,
): Promise<SearchFetchResult<PlaylistData[]>> => {
  try {
    const response = await playlistsApi.getPlaylists().playlistControllerFindAll({
      limit,
      search: query,
    })
    const playlists = (response.playlists ?? []).map(mapPlaylistEntityToPlaylistData)
    return { data: playlists, fromNetwork: true }
  } catch (error) {
    console.error('fetchPlaylistTitleMatches network failed:', error)
    try {
      return { data: (await getCachedPlaylistSearch(query)) ?? [], fromNetwork: false }
    } catch (cacheError) {
      console.error('Playlist search cache read failed:', cacheError)
      return { data: [], fromNetwork: false }
    }
  }
}

/**
 * Persists a fresh sermon search result to its per-query cache.
 * @param query - Trimmed search query used as the cache key.
 * @param result - Sermon fetch result; written only when it came from the network.
 */
export const persistSermonSearchResults = (
  query: string,
  result: SearchFetchResult<SermonData[]>,
): void => {
  if (result.fromNetwork)
    void setCachedSearchResults(query, result.data).catch(error =>
      console.error('Search cache write failed:', error),
    )
}

/**
 * Persists a fresh playlist search result to its per-query cache.
 * @param query - Trimmed search query used as the cache key.
 * @param result - Playlist fetch result; written only when it came from the network.
 */
export const persistPlaylistSearchResults = (
  query: string,
  result: SearchFetchResult<PlaylistData[]>,
): void => {
  if (result.fromNetwork)
    void setCachedPlaylistSearch(query, result.data).catch(error =>
      console.error('Playlist search cache write failed:', error),
    )
}

/**
 * Persists both compact-search results to their per-query caches.
 * @param query - Trimmed search query used as the cache key.
 * @param sermonResult - Sermon fetch result.
 * @param playlistResult - Playlist fetch result.
 */
export const persistSearchResults = (
  query: string,
  sermonResult: SearchFetchResult<SermonData[]>,
  playlistResult: SearchFetchResult<PlaylistData[]>,
): void => {
  persistSermonSearchResults(query, sermonResult)
  persistPlaylistSearchResults(query, playlistResult)
}
