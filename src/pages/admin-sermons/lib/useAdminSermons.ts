import { useCallback, useEffect, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { reportError } from 'shared/model/error-dialog'

export interface AdminSermonsState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  onOrderChange: (order: APITypes.SermonControllerFindAllOrder) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: APITypes.SermonControllerFindAllSort) => void
  order: APITypes.SermonControllerFindAllOrder
  search: string
  sermons: APITypes.SermonEntity[]
  sort: APITypes.SermonControllerFindAllSort
}

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповеди'

/**
 * Одна страница проповедей; `hasMore` — пришла ли полная страница.
 * @param query - Поисковый запрос (название, проповедник, книга, описание).
 * @param sort - Вариант сортировки.
 * @param order - Направление сортировки.
 * @param page - Номер страницы (с 1).
 */
const fetchPage = async (
  query: string,
  sort: APITypes.SermonControllerFindAllSort,
  order: APITypes.SermonControllerFindAllOrder,
  page: number,
): Promise<APITypes.AllSermonsResponse> =>
  sermonsApi.getSermons().sermonControllerFindAll({
    limit: PAGE_SIZE,
    order,
    page,
    search: query || undefined,
    sort,
  })

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
  const [sermons, setSermons] = useState<APITypes.SermonEntity[]>([])
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
        setSermons(response.sermons)
        setHasMore(response.sermons.length === PAGE_SIZE)
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
      const nextPage = Math.floor(sermons.length / PAGE_SIZE) + 1
      const response = await fetchPage(query, sort, order, nextPage)
      setSermons(current => [...current, ...response.sermons])
      setHasMore(response.sermons.length === PAGE_SIZE)
    } catch (error) {
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoading, isLoadingMore, order, query, sermons.length, sort])

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
    search,
    sermons,
    sort,
  }
}
