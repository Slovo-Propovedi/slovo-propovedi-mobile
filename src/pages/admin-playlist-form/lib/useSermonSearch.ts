import { useCallback, useEffect, useRef, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { reportError } from 'shared/model/error-dialog'

export interface SermonSearchState {
  hasMore: boolean
  isError: boolean
  isLoading: boolean
  isLoadingMore: boolean
  loadMore: () => Promise<void>
  loadMoreFailed: boolean
  sermons: APITypes.SermonEntity[]
}

const SEARCH_DEBOUNCE_MS = 300
const SERMONS_TAKE = 20
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповеди'

/**
 * Поисковый список проповедей для пикера формы: дебаунс 300мс и курсорная
 * дозагрузка (`take` + `nextCursor`; `page`/`limit` не используются — они
 * взаимоисключительны с курсором). Смена поиска сбрасывает список и курсор.
 * Дозагрузка защищена счётчиком поколений: ответ, пришедший после смены
 * запроса, отбрасывается, а не подмешивается к новому списку.
 * @param search — текущая поисковая строка (дебаунсится внутри).
 */
export const useSermonSearch = (search: string): SermonSearchState => {
  const [term, setTerm] = useState(search)
  const [sermons, setSermons] = useState<APITypes.SermonEntity[]>([])
  const [cursor, setCursor] = useState<null | string>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const [isError, setIsError] = useState(false)

  const termRef = useRef(term)
  const isLoadingMoreRef = useRef(false)
  const generationRef = useRef(0)

  const debouncedSetTerm = useDebounce(setTerm, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetTerm(search)
  }, [search, debouncedSetTerm])

  useEffect(() => {
    let isActive = true

    const generation = ++generationRef.current

    termRef.current = term
    isLoadingMoreRef.current = false

    const load = async () => {
      setIsLoading(true)
      setIsError(false)
      setIsLoadingMore(false)
      setLoadMoreFailed(false)
      setSermons([])
      setCursor(null)
      setHasMore(false)

      try {
        const response = await sermonsApi
          .getSermons()
          .sermonControllerFindAll({ search: term || undefined, take: SERMONS_TAKE })
        if (!isActive || generationRef.current !== generation) return
        setSermons(response.sermons)
        setCursor(response.nextCursor)
        setHasMore(response.nextCursor !== null)
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
  }, [term])

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || isLoading || !hasMore || cursor === null) return

    const generation = generationRef.current
    const requestTerm = termRef.current
    isLoadingMoreRef.current = true
    setIsLoadingMore(true)
    setLoadMoreFailed(false)

    try {
      const response = await sermonsApi
        .getSermons()
        .sermonControllerFindAll({ cursor, search: requestTerm || undefined, take: SERMONS_TAKE })
      if (generationRef.current !== generation) return
      setSermons(current => [...current, ...response.sermons])
      setCursor(response.nextCursor)
      setHasMore(response.nextCursor !== null)
    } catch (error) {
      if (generationRef.current !== generation) return
      setLoadMoreFailed(true)
      reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      isLoadingMoreRef.current = false
      setIsLoadingMore(false)
    }
  }, [cursor, hasMore, isLoading])

  return { hasMore, isError, isLoading, isLoadingMore, loadMore, loadMoreFailed, sermons }
}
