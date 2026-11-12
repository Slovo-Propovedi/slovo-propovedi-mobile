import { fetchPlaylistSearchPage, fetchSermonSearchPage } from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { type GroupState } from './pagedGroup'

const FIRST_PAGE = 1

interface FirstPages {
  playlistPage: Awaited<ReturnType<typeof fetchPlaylistSearchPage>>
  sermonPage: Awaited<ReturnType<typeof fetchSermonSearchPage>>
}

/**
 * Fetches the first page of both searchable groups in parallel.
 * @param query - Trimmed active search query.
 */
export const fetchFirstPage = async (query: string): Promise<FirstPages> => {
  const [sermonPage, playlistPage] = await Promise.all([
    fetchSermonSearchPage(query),
    fetchPlaylistSearchPage(query, FIRST_PAGE),
  ])

  return { playlistPage, sermonPage }
}

/**
 * Converts the first fetched pages into the hook's per-group state.
 * @param pages - First pages of both groups.
 */
export const buildFirstPageState = (
  pages: FirstPages,
): { playlists: GroupState<PlaylistData>; sermons: GroupState<SermonData> } => ({
  playlists: {
    hasMore:
      pages.playlistPage.playlists.length > 0 &&
      pages.playlistPage.playlists.length < pages.playlistPage.count,
    isLoading: false,
    isLoadingMore: false,
    items: pages.playlistPage.playlists,
  },
  sermons: {
    hasMore: pages.sermonPage.nextCursor !== null,
    isLoading: false,
    isLoadingMore: false,
    items: pages.sermonPage.sermons,
  },
})
