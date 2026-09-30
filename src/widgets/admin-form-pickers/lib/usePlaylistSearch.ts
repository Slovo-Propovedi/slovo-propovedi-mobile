import { useEffect, useState } from 'react'
import { type APITypes, playlistsApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'

export interface PlaylistSearchState {
  isError: boolean
  isLoading: boolean
  isSearchActive: boolean
  playlists: APITypes.PlaylistEntity[]
}

interface PlaylistSearchResult {
  isError: boolean
  playlists: APITypes.PlaylistEntity[]
  term: null | string
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * Поисковый список плейлистов для пикеров форм админки: дебаунс 300мс,
 * сортировка по названию по возрастанию.
 * @param search — текущая поисковая строка (дебаунсится внутри).
 */
export const usePlaylistSearch = (search: string): PlaylistSearchState => {
  const [term, setTerm] = useState(search)
  const [result, setResult] = useState<PlaylistSearchResult>({
    isError: false,
    playlists: [],
    term: null,
  })

  const debouncedSetTerm = useDebounce(setTerm, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetTerm(search)
  }, [search, debouncedSetTerm])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const response = await playlistsApi
          .getPlaylists()
          .playlistControllerFindAll({ order: 'asc', search: term || undefined, sort: 'title' })
        if (isActive) setResult({ isError: false, playlists: response.playlists, term })
      } catch {
        if (isActive) setResult({ isError: true, playlists: [], term })
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [term])

  return {
    isError: result.isError,
    isLoading: result.term !== term,
    isSearchActive: term !== '',
    playlists: result.playlists,
  }
}
