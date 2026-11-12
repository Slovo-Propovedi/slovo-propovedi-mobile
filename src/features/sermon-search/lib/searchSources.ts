import { mapPlaylistEntityToPlaylistData, type PlaylistData } from 'entities/playlist'
import { mapAllSermonsResponse, type SermonData } from 'entities/sermon'
import { type APITypes, playlistsApi, sermonsApi } from 'shared/api'
import { getCachedPlaylistSearch, setCachedPlaylistSearch } from './playlistSearchCache'
import { getCachedSearchResults, setCachedSearchResults } from './searchCache'

const SERMON_PAGE_SIZE = 20
const PLAYLIST_PAGE_SIZE = 20

export interface PlaylistSearchPage {
  count: number
  fromNetwork: boolean
  playlists: PlaylistData[]
}

export interface SermonSearchPage {
  fromNetwork: boolean
  nextCursor: null | string
  sermons: SermonData[]
}

/**
 * Fetches one sermon search page. The first page falls back to the per-query
 * cache on a network failure; later pages return empty instead. Never rejects.
 * @param query - Trimmed search query.
 * @param cursor - Keyset cursor of the previous page; omitted for the first page.
 */
export const fetchSermonSearchPage = async (
  query: string,
  cursor?: string,
): Promise<SermonSearchPage> => {
  const params: APITypes.SermonControllerFindAllParams = { search: query, take: SERMON_PAGE_SIZE }
  if (cursor != null) params.cursor = cursor

  try {
    const response = await sermonsApi.getSermons().sermonControllerFindAll(params)
    const sermons = mapAllSermonsResponse(response)
    if (cursor == null)
      void setCachedSearchResults(query, sermons).catch(error =>
        console.error('Search cache write failed:', error),
      )
    return { fromNetwork: true, nextCursor: response.nextCursor ?? null, sermons }
  } catch (error) {
    console.error('fetchSermonSearchPage network failed:', error)
    if (cursor != null) return { fromNetwork: false, nextCursor: null, sermons: [] }

    try {
      const cached = (await getCachedSearchResults(query)) ?? []
      return { fromNetwork: false, nextCursor: null, sermons: cached }
    } catch (cacheError) {
      console.error('Search cache read failed:', cacheError)
      return { fromNetwork: false, nextCursor: null, sermons: [] }
    }
  }
}

/**
 * Fetches one playlist search page. The first page falls back to the per-query
 * cache on a network failure; later pages return empty instead. Never rejects.
 * @param query - Trimmed search query.
 * @param page - 1-based offset page.
 */
export const fetchPlaylistSearchPage = async (
  query: string,
  page: number,
): Promise<PlaylistSearchPage> => {
  try {
    const response = await playlistsApi
      .getPlaylists()
      .playlistControllerFindAll({ limit: PLAYLIST_PAGE_SIZE, page, search: query })
    const playlists = (response.playlists ?? []).map(mapPlaylistEntityToPlaylistData)
    if (page === 1)
      void setCachedPlaylistSearch(query, playlists).catch(error =>
        console.error('Playlist search cache write failed:', error),
      )
    return { count: response.count, fromNetwork: true, playlists }
  } catch (error) {
    console.error('fetchPlaylistSearchPage network failed:', error)
    if (page > 1) return { count: 0, fromNetwork: false, playlists: [] }

    try {
      const cached = (await getCachedPlaylistSearch(query)) ?? []
      return { count: cached.length, fromNetwork: false, playlists: cached }
    } catch (cacheError) {
      console.error('Playlist search cache read failed:', cacheError)
      return { count: 0, fromNetwork: false, playlists: [] }
    }
  }
}
