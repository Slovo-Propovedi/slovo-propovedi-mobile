import { useCallback, useEffect, useRef, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'

export interface SermonSearchState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  sermons: APITypes.SermonEntity[]
}

const SEARCH_DEBOUNCE_MS = 300
const SERMONS_TAKE = 20

/**
 * Поисковый список проповедей для пикера формы: дебаунс 300мс и курсорная
 * дозагрузка (`take` + `nextCursor`; `page`/`limit` не используются — они
 * взаимоисключительны с курсором). Смена поиска сбрасывает список и курсор.
 * @param search — текущая поисковая строка (дебаунсится внутри).
 */
export const useSermonSearch = (search: string): SermonSearchState => {
  const [term, setTerm] = useState(search)
  const [sermons, setSermons] = useState<APITypes.SermonEntity[]>([])
  const [cursor, setCursor] = useState<null | string>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isError, setIsError] = useState(false)

  const termRef = useRef(term)
  const isLoadingMoreRef = useRef(false)

  const debouncedSetTerm = useDebounce(setTerm, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetTerm(search)
  }, [search, debouncedSetTerm])

  useEffect(() => {
    let isActive = true

    termRef.current = term
    isLoadingMoreRef.current = false

    const load = async () => {
      setIsLoading(true)
      setIsError(false)
      setIsLoadingMore(false)
      setSermons([])
      setCursor(null)
      setHasMore(false)

      try {
        const response = await sermonsApi
          .getSermons()
          .sermonControllerFindAll({ search: term || undefined, take: SERMONS_TAKE })
        if (!isActive) return
        setSermons(response.sermons)
        setCursor(response.nextCursor)
        setHasMore(response.nextCursor !== null)
      } catch {
        if (isActive) setIsError(true)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [term])

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || isLoading || !hasMore || cursor === null) return

    const requestTerm = termRef.current
    isLoadingMoreRef.current = true
    setIsLoadingMore(true)

    try {
      const response = await sermonsApi
        .getSermons()
        .sermonControllerFindAll({ cursor, search: requestTerm || undefined, take: SERMONS_TAKE })
      if (termRef.current !== requestTerm) return
      setSermons(current => [...current, ...response.sermons])
      setCursor(response.nextCursor)
      setHasMore(response.nextCursor !== null)
    } catch {
      // Дозагрузка не удалась — оставляем уже показанную часть списка.
    } finally {
      isLoadingMoreRef.current = false
      setIsLoadingMore(false)
    }
  }, [cursor, hasMore, isLoading])

  return { hasMore, isError, isLoading, isLoadingMore, loadMore, sermons }
}
