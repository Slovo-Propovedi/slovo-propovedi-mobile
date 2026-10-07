import { useEffect, useState } from 'react'
import {
  collectMatchingPreachers,
  fetchPlaylistTitleMatches,
  fetchSermonResults,
  mergePlaylistResults,
  persistPlaylistSearchResults,
  persistSermonSearchResults,
} from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { type SearchResultsType } from './parseSearchResultsParams'

const FULL_SERMONS_TAKE = 100
const FULL_PLAYLISTS_LIMIT = 100

/**
 * Fetches the full result list for one group, always from the network first
 * (with the feature's per-query cache as offline fallback). Not cached in the
 * compact atoms, which hold truncated data.
 * @param type - Result group to load.
 * @param query - Search query (already validated/trimmed).
 */
export const useSearchResults = (type: SearchResultsType, query: string) => {
  const [sermons, setSermons] = useState<SermonData[]>([])
  const [playlists, setPlaylists] = useState<PlaylistData[]>([])
  const [preachers, setPreachers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!query) return

    let cancelled = false

    const load = async () => {
      if (cancelled) return
      setIsLoading(true)

      if (type === 'playlists') {
        const [sermonResult, playlistResult] = await Promise.all([
          fetchSermonResults(query, FULL_SERMONS_TAKE),
          fetchPlaylistTitleMatches(query, FULL_PLAYLISTS_LIMIT),
        ])
        if (cancelled) return
        persistSermonSearchResults(query, sermonResult)
        persistPlaylistSearchResults(query, playlistResult)
        setPlaylists(mergePlaylistResults(playlistResult.data, sermonResult.data))
        return
      }

      const result = await fetchSermonResults(query, FULL_SERMONS_TAKE)
      if (cancelled) return
      persistSermonSearchResults(query, result)
      if (type === 'sermons') setSermons(result.data)
      else setPreachers(collectMatchingPreachers(result.data, query))
    }

    void load().finally(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [query, type])

  return { isLoading, playlists, preachers, sermons }
}
