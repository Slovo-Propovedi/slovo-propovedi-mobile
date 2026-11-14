import { useAtom } from '@reatom/npm-react'
import { isSearchFieldVisibleAtom } from '../model-searchField'

export const useIsSearchFieldVisible = () => {
  const [isSearchFieldVisible] = useAtom(isSearchFieldVisibleAtom)

  return isSearchFieldVisible
}
