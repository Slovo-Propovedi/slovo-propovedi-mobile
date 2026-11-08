import { useAtom } from '@reatom/npm-react'
import { searchQueryAtom } from '../model'
import { isSearchQueryActive } from '../model-searchField'

export const useIsSearchActive = () => {
  const [query] = useAtom(searchQueryAtom)

  return isSearchQueryActive(query)
}
