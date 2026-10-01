import { useCallback, useEffect, useState } from 'react'
import { type APITypes, playlistsApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { reportError } from 'shared/model/error-dialog'

export interface AdminPlaylistsState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  onOrderChange: (order: APITypes.PlaylistControllerFindAllOrder) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: APITypes.PlaylistControllerFindAllSort) => void
  order: APITypes.PlaylistControllerFindAllOrder
  playlists: APITypes.PlaylistEntity[]
  search: string
  sort: APITypes.PlaylistControllerFindAllSort
}

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить плейлисты'

/**
 * Одна страница плейлистов; `hasMore` — пришла ли полная страница.
 * @param query - Поисковый запрос по названию/описанию.
 * @param sort - Вариант сортировки.
 * @param order - Направление сортировки.
 * @param page - Номер страницы (с 1).
 */
const fetchPage = async (
  query: string,
  sort: APITypes.PlaylistControllerFindAllSort,
  order: APITypes.PlaylistControllerFindAllOrder,
  page: number,
): Promise<APITypes.AllPlaylistsResponse> =>
  playlistsApi.getPlaylists().playlistControllerFindAll({
    limit: PAGE_SIZE,
    order,
    page,
    search: query || undefined,
    sort,
  })

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

  const debouncedSetQuery = useDebounce(setQuery, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetQuery(search)
  }, [search, debouncedSetQuery])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const response = await fetchPage(query, sort, order, 1)
        if (!isActive) return
        setPlaylists(response.playlists)
        setHasMore(response.playlists.length === PAGE_SIZE)
      } catch (error) {
        if (!isActive) return
        setIsError(true)
        reportError(error, LOAD_ERROR_MESSAGE)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [query, sort, order])

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const nextPage = Math.floor(playlists.length / PAGE_SIZE) + 1
      const response = await fetchPage(query, sort, order, nextPage)
      setPlaylists(current => [...current, ...response.playlists])
      setHasMore(response.playlists.length === PAGE_SIZE)
    } catch (error) {
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
    onOrderChange: setOrder,
    onSearchChange: setSearch,
    onSortChange: setSort,
    order,
    playlists,
    search,
    sort,
  }
}
