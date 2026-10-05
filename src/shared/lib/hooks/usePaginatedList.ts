import { useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { reportError } from '../../model/error-dialog'

interface PaginatedListOptions<T> {
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
  items: T[]
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
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
export const usePaginatedList = <T>({
  errorMessage,
  fetchPage,
  pageSize,
}: PaginatedListOptions<T>): PaginatedListState<T> => {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isError, setIsError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)

  const generationRef = useRef(0)
  const hasLoadedRef = useRef(false)
  const isRefreshingRef = useRef(false)

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
      const page = await fetchPage(1)
      if (generationRef.current !== generation) return
      setItems(page)
      setHasMore(page.length === pageSize)
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
  }, [errorMessage, fetchPage, pageSize])

  useFocusEffect(
    useCallback(() => {
      void loadFirstPage()
    }, [loadFirstPage]),
  )

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || isRefreshingRef.current || !hasMore) return

    const generation = generationRef.current
    setIsLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      const nextPage = Math.floor(items.length / pageSize) + 1
      const page = await fetchPage(nextPage)
      if (generationRef.current !== generation) return
      setItems(current => [...current, ...page])
      setHasMore(page.length === pageSize)
    } catch (error) {
      if (generationRef.current !== generation) return
      setLoadMoreFailed(true)
      reportError(error, errorMessage)
    } finally {
      setIsLoadingMore(false)
    }
  }, [errorMessage, fetchPage, hasMore, isLoading, isLoadingMore, items.length, pageSize])

  return { hasMore, isError, isLoading, isLoadingMore, items, loadMore, loadMoreFailed }
}
