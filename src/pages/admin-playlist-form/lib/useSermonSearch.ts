import { useEffect, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { useDebounce } from 'shared/lib/hooks/useDebounce'

export interface SermonSearchState {
  isError: boolean
  isLoading: boolean
  sermons: APITypes.SermonEntity[]
}

interface SermonSearchResult {
  isError: boolean
  sermons: APITypes.SermonEntity[]
  term: null | string
}

const SEARCH_DEBOUNCE_MS = 300
const SERMONS_TAKE = 20

/**
 * Поисковый список проповедей для пикера формы: дебаунс 300мс.
 * @param search — текущая поисковая строка (дебаунсится внутри).
 */
export const useSermonSearch = (search: string): SermonSearchState => {
  const [term, setTerm] = useState(search)
  const [result, setResult] = useState<SermonSearchResult>({
    isError: false,
    sermons: [],
    term: null,
  })

  const debouncedSetTerm = useDebounce(setTerm, SEARCH_DEBOUNCE_MS, [])

  useEffect(() => {
    debouncedSetTerm(search)
  }, [search, debouncedSetTerm])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const response = await sermonsApi
          .getSermons()
          .sermonControllerFindAll({ search: term || undefined, take: SERMONS_TAKE })
        if (isActive) setResult({ isError: false, sermons: response.sermons, term })
      } catch {
        if (isActive) setResult({ isError: true, sermons: [], term })
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [term])

  return {
    isError: result.isError,
    isLoading: result.term !== term,
    sermons: result.sermons,
  }
}
