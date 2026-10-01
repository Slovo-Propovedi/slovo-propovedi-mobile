import { useCallback, useEffect, useRef, useState } from 'react'
import { type APITypes } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { reportError } from 'shared/model/error-dialog'
import { fetchPlaylistsPage, PLAYLISTS_PAGE_SIZE } from './fetchPlaylistsPage'

export interface AdminPlaylistsState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
  onOrderChange: (order: APITypes.PlaylistControllerFindAllOrder) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: APITypes.PlaylistControllerFindAllSort) => void
  order: APITypes.PlaylistControllerFindAllOrder
  playlists: APITypes.PlaylistEntity[]
  search: string
  sort: APITypes.PlaylistControllerFindAllSort
}

const SEARCH_DEBOUNCE_MS = 300
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить плейлисты'

/**
 * Пагинированный список плейлистов админки: поиск с дебаунсом 300мс,
 * сортировка и автодозагрузка следующей страницы при достижении конца
 * списка. При смене поиска/сортировки список перезагружается с первой страницы.
 */
export const useAdminPlaylists = (): AdminPlaylistsState => {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<APITypes.PlaylistControllerFindAllSort>('date')
  const [order, setOrder] = useState<APITypes.PlaylistControllerFindAllOrder>('desc')
  const [query, setQuery] = useState('')
  const [playlists, setPlaylists] = useState<APITypes.PlaylistEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isError, setIsError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)

  const generationRef = useRef(0)

  const debouncedSetQuery = useDebounce(setQuery, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetQuery(search)
  }, [search, debouncedSetQuery])

  useEffect(() => {
    let isActive = true

    const generation = ++generationRef.current

    const load = async () => {
      setIsLoading(true)
      setIsError(false)
      setLoadMoreFailed(false)
      try {
        const response = await fetchPlaylistsPage(query, sort, order, 1)
        if (!isActive || generationRef.current !== generation) return
        setPlaylists(response.playlists)
        setHasMore(response.playlists.length === PLAYLISTS_PAGE_SIZE)
      } catch (error) {
        if (!isActive || generationRef.current !== generation) return
        setIsError(true)
        reportError(error, LOAD_ERROR_MESSAGE)
      } finally {
        if (isActive && generationRef.current === generation) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [query, sort, order])

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return

    const generation = generationRef.current
    setIsLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      const nextPage = Math.floor(playlists.length / PLAYLISTS_PAGE_SIZE) + 1
      const response = await fetchPlaylistsPage(query, sort, order, nextPage)
      if (generationRef.current !== generation) return
      setPlaylists(current => [...current, ...response.playlists])
      setHasMore(response.playlists.length === PLAYLISTS_PAGE_SIZE)
    } catch (error) {
      if (generationRef.current !== generation) return
      setLoadMoreFailed(true)
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoading, isLoadingMore, order, playlists.length, query, sort])

  return {
    hasMore,
    isError,
    isLoading,
    isLoadingMore,
    loadMore,
    loadMoreFailed,
    onOrderChange: setOrder,
    onSearchChange: setSearch,
    onSortChange: setSort,
    order,
    playlists,
    search,
    sort,
  }
}
