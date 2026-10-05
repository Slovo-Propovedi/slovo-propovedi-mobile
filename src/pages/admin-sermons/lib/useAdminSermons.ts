import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type APITypes } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { reportError } from 'shared/model/error-dialog'
import { fetchSermonsPage, SERMONS_PAGE_SIZE } from './fetchSermonsPage'

export interface AdminSermonsState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
  onOrderChange: (order: APITypes.SermonControllerFindAllOrder) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: APITypes.SermonControllerFindAllSort) => void
  order: APITypes.SermonControllerFindAllOrder
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
  const [sermons, setSermons] = useState<APITypes.SermonEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isError, setIsError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)

  const generationRef = useRef(0)
  const hasLoadedRef = useRef(false)

  const debouncedSetQuery = useDebounce(setQuery, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetQuery(search)
  }, [search, debouncedSetQuery])

  const loadFirstPage = useCallback(async () => {
    const showSkeleton = !hasLoadedRef.current
    const generation = ++generationRef.current

    if (showSkeleton) {
      setIsLoading(true)
      setIsError(false)
      setLoadMoreFailed(false)
    }

    try {
      const response = await fetchSermonsPage(query, sort, order, 1)
      if (generationRef.current !== generation) return
      setSermons(response.sermons)
      setHasMore(response.sermons.length === SERMONS_PAGE_SIZE)
      hasLoadedRef.current = true
    } catch (error) {
      if (generationRef.current !== generation) return
      if (showSkeleton) setIsError(true)
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      if (generationRef.current === generation && showSkeleton) setIsLoading(false)
    }
  }, [order, query, sort])

  // Загрузка первой страницы на маунте и при смене поиска/сортировки, а также
  // молчаливое обновление при возврате на экран. Скелетон показывается только
  // до первой успешной загрузки, поэтому возврат с формы редактирования
  // обновляет строку без мигания списка.
  useFocusEffect(
    useCallback(() => {
      void loadFirstPage()
    }, [loadFirstPage]),
  )

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return

    const generation = generationRef.current
    setIsLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      const nextPage = Math.floor(sermons.length / SERMONS_PAGE_SIZE) + 1
      const response = await fetchSermonsPage(query, sort, order, nextPage)
      if (generationRef.current !== generation) return
      setSermons(current => [...current, ...response.sermons])
      setHasMore(response.sermons.length === SERMONS_PAGE_SIZE)
    } catch (error) {
      if (generationRef.current !== generation) return
      setLoadMoreFailed(true)
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
    loadMoreFailed,
    onOrderChange: setOrder,
    onSearchChange: setSearch,
    onSortChange: setSort,
    order,
    search,
    sermons,
    sort,
  }
}
