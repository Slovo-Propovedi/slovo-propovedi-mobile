import { useAtom } from '@reatom/npm-react'
import { MIN_QUERY_LENGTH, searchQueryAtom } from '../model'

export const useIsSearchActive = () => {
  const [query] = useAtom(searchQueryAtom)

  return query.trim().length >= MIN_QUERY_LENGTH
}
