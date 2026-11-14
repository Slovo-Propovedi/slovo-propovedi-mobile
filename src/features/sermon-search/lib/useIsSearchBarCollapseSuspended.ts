import { useAtom } from '@reatom/npm-react'
import { isSearchBarCollapseSuspendedAtom } from '../model-searchField'

export const useIsSearchBarCollapseSuspended = () => {
  const [isSuspended] = useAtom(isSearchBarCollapseSuspendedAtom)

  return isSuspended
}
