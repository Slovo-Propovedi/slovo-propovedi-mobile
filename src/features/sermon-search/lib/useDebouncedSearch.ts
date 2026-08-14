import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { fetchSearchResults, isSearchingAtom, searchQueryAtom } from '../model'

const DEBOUNCE_DELAY_MS = 400

export const useDebouncedSearch = () => {
  const [query] = useAtom(searchQueryAtom)
  const [, setIsSearching] = useAtom(isSearchingAtom)
  const fetchResults = useAction(fetchSearchResults)

  useEffect(() => {
    const trimmedQuery = query.trim()

    setIsSearching(true)

    const timer = setTimeout(() => {
      void fetchResults(trimmedQuery)
    }, DEBOUNCE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [fetchResults, query, setIsSearching])
}
