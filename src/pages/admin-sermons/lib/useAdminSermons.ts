import { useCallback, useEffect, useState } from 'react'
import { type APITypes } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { usePaginatedList } from 'shared/lib/hooks/usePaginatedList'
import { fetchSermonsPage, SERMONS_PAGE_SIZE } from './fetchSermonsPage'

export interface AdminSermonsState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshing: boolean
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
  onOrderChange: (order: APITypes.SermonControllerFindAllOrder) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: APITypes.SermonControllerFindAllSort) => void
  order: APITypes.SermonControllerFindAllOrder
  refresh: () => Promise<void>
  search: string
  sermons: APITypes.SermonEntity[]
  sort: APITypes.SermonControllerFindAllSort
}

const SEARCH_DEBOUNCE_MS = 300
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповеди'

/**
 * Пагинированный список проповедей админки: поиск с дебаунсом 300мс,
 * сортировка и автодозагрузка следующей страницы при достижении конца
 * списка. При смене поиска/сортировки список перезагружается с первой страницы.
 */
export const useAdminSermons = (): AdminSermonsState => {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<APITypes.SermonControllerFindAllSort>('date')
  const [order, setOrder] = useState<APITypes.SermonControllerFindAllOrder>('desc')
  const [query, setQuery] = useState('')

  const debouncedSetQuery = useDebounce(setQuery, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetQuery(search)
  }, [search, debouncedSetQuery])

  const fetchPage = useCallback(
    (page: number) => fetchSermonsPage(query, sort, order, page).then(response => response.sermons),
    [order, query, sort],
  )

  const {
    hasMore,
    isError,
    isLoading,
    isLoadingMore,
    isRefreshing,
    items: sermons,
    loadMore,
    loadMoreFailed,
    refresh,
  } = usePaginatedList({
    errorMessage: LOAD_ERROR_MESSAGE,
    fetchPage,
    pageSize: SERMONS_PAGE_SIZE,
  })

  return {
    hasMore,
    isError,
    isLoading,
    isLoadingMore,
    isRefreshing,
    loadMore,
    loadMoreFailed,
    onOrderChange: setOrder,
    onSearchChange: setSearch,
    onSortChange: setSort,
    order,
    refresh,
    search,
    sermons,
    sort,
  }
}
