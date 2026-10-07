import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import {
  fetchSearchResults,
  isSearchingAtom,
  lastFetchedQueryAtom,
  searchQueryAtom,
} from '../model'

const DEBOUNCE_DELAY_MS = 400

export const useDebouncedSearch = () => {
  const [query] = useAtom(searchQueryAtom)
  const [lastFetchedQuery] = useAtom(lastFetchedQueryAtom)
  const [, setIsSearching] = useAtom(isSearchingAtom)
  const fetchResults = useAction(fetchSearchResults)

  useEffect(() => {
    const trimmedQuery = query.trim()

    // Already fetched (e.g. a web deep-link seed called `fetchSearchResults`
    // directly) — don't schedule a duplicate debounced fetch.
    if (trimmedQuery === lastFetchedQuery) return

    setIsSearching(true)

    const timer = setTimeout(() => {
      void fetchResults(trimmedQuery)
    }, DEBOUNCE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [fetchResults, lastFetchedQuery, query, setIsSearching])
}
