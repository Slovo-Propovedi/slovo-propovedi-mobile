import { type RefObject, useCallback, useState } from 'react'
import { reportError } from '../../model/error-dialog'

/**
 * Rows and next-page loading for `usePaginatedList`. Ignored while the list is loading,
 * already loading more, reloading the first page (`isReloadingRef`) or has no
 * more pages; a page that lands after a reload (`generationRef` moved) is dropped.
 * @param options - State shared with `usePaginatedList`.
 * @param options.errorMessage - Message for the global error dialog.
 * @param options.fetchPage - Page loader (1-based).
 * @param options.generationRef - Reload generation counter.
 * @param options.isLoading - Whether the first load is in flight.
 * @param options.isReloadingRef - Whether a first-page reload is in flight.
 * @param options.pageSize - Rows per page.
 */
export const usePaginatedLoadMore = <T>({
  errorMessage,
  fetchPage,
  generationRef,
  isLoading,
  isReloadingRef,
  pageSize,
}: {
  errorMessage: string
  fetchPage: (page: number) => Promise<T[]>
  generationRef: RefObject<number>
  isLoading: boolean
  isReloadingRef: RefObject<boolean>
  pageSize: number
}) => {
  const [items, setItems] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || isReloadingRef.current || !hasMore) return

    const generation = generationRef.current
    setIsLoadingMore(true)
    setLoadMoreFailed(false)
    try {
      const page = await fetchPage(Math.floor(items.length / pageSize) + 1)
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
  }, [
    errorMessage,
    fetchPage,
    generationRef,
    hasMore,
    isLoading,
    isLoadingMore,
    isReloadingRef,
    items.length,
    pageSize,
  ])

  // A first page (cached or fresh) replaces the rows.
  const applyFirstPage = useCallback(
    (page: T[]) => {
      setItems(page)
      setHasMore(page.length === pageSize)
    },
    [pageSize],
  )

  return {
    applyFirstPage,
    hasMore,
    isLoadingMore,
    items,
    loadMore,
    loadMoreFailed,
    setLoadMoreFailed,
  }
}
