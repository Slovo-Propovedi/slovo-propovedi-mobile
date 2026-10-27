import { useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { reportError } from '../../model/error-dialog'
import { fetchFirstPage, type FirstPageCache } from './fetchFirstPage'
import { usePaginatedLoadMore } from './usePaginatedLoadMore'

interface PaginatedListOptions<T> {
  /** Optional first-page cache: shown instantly, then revalidated. */
  cache?: FirstPageCache<T>
  /** Message shown in the global error dialog when a page request fails. */
  errorMessage: string
  /** Loads one page (1-based); a page shorter than `pageSize` ends the list. */
  fetchPage: (page: number) => Promise<T[]>
  /** Rows per page — a full page means `hasMore`. */
  pageSize: number
}

interface PaginatedListState<T> {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshing: boolean
  items: T[]
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
  refresh: () => Promise<void>
}

// Пагинированный список с автодозагрузкой (`loadMore`) и молчаливым обновлением
// первой страницы при возврате на экран (`useFocusEffect`).
//
// Первая страница заменяет список, поэтому: скелетон показывается только до
// первой успешной загрузки, флаг «Повторить загрузку» сбрасывается на каждом
// перезагрузе, а `loadMore` игнорируется, пока перезагрузка в полёте — иначе
// `onEndReached` дописал бы страницу со старым офсетом поверх заменяемого списка.
// Смена фильтров — это смена identity `fetchPage`, и она тоже перезагружает первую
// страницу.
// `refresh` — ручной pull-to-refresh: тот же перезагруз первой страницы, но
// `isRefreshing` питает спиннер `RefreshControl` (фокус обновляет молча).
export const usePaginatedList = <T>({
  cache,
  errorMessage,
  fetchPage,
  pageSize,
}: PaginatedListOptions<T>): PaginatedListState<T> => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const generationRef = useRef(0)
  const hasLoadedRef = useRef(false)
  const isRefreshingRef = useRef(false)

  const { applyFirstPage, setLoadMoreFailed, ...pageState } = usePaginatedLoadMore({
    errorMessage,
    fetchPage,
    generationRef,
    isLoading,
    isReloadingRef: isRefreshingRef,
    pageSize,
  })

  const loadFirstPage = useCallback(async () => {
    const showSkeleton = !hasLoadedRef.current
    const generation = ++generationRef.current

    // First page replaces the list, so a stale «Повторить загрузку» footer must
    // clear on every reload — including silent focus refreshes — not only on the
    // skeleton (first ever) load.
    isRefreshingRef.current = true
    setLoadMoreFailed(false)

    if (showSkeleton) {
      setIsLoading(true)
      setIsError(false)
    }

    try {
      const page = await fetchFirstPage({
        cache,
        fetchPage,
        isInitial: showSkeleton,
        onCached: cachedPage => {
          if (generationRef.current !== generation) return
          applyFirstPage(cachedPage)
          setIsLoading(false)
        },
      })
      if (generationRef.current !== generation) return
      applyFirstPage(page)
      hasLoadedRef.current = true
    } catch (error) {
      if (generationRef.current !== generation) return
      if (showSkeleton) setIsError(true)
      reportError(error, errorMessage)
    } finally {
      if (generationRef.current === generation) {
        isRefreshingRef.current = false
        if (showSkeleton) setIsLoading(false)
      }
    }
  }, [applyFirstPage, cache, errorMessage, fetchPage, setLoadMoreFailed])

  useFocusEffect(
    useCallback(() => {
      void loadFirstPage()
    }, [loadFirstPage]),
  )

  const refresh = useCallback(() => {
    setIsRefreshing(true)
    return loadFirstPage().finally(() => setIsRefreshing(false))
  }, [loadFirstPage])

  return { ...pageState, isError, isLoading, isRefreshing, refresh }
}
