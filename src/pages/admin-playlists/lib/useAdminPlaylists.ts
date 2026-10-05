import { useCallback, useEffect, useState } from 'react'
import { type APITypes } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { usePaginatedList } from 'shared/lib/hooks/usePaginatedList'
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

  const debouncedSetQuery = useDebounce(setQuery, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetQuery(search)
  }, [search, debouncedSetQuery])

  const fetchPage = useCallback(
    (page: number) =>
      fetchPlaylistsPage(query, sort, order, page).then(response => response.playlists),
    [order, query, sort],
  )

  const {
    hasMore,
    isError,
    isLoading,
    isLoadingMore,
    items: playlists,
    loadMore,
    loadMoreFailed,
  } = usePaginatedList({
    errorMessage: LOAD_ERROR_MESSAGE,
    fetchPage,
    pageSize: PLAYLISTS_PAGE_SIZE,
  })

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
