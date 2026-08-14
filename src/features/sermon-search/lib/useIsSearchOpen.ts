import { useAtom } from '@reatom/npm-react'
import { isSearchOpenAtom } from '../model'

export const useIsSearchOpen = () => {
  const [isSearchOpen] = useAtom(isSearchOpenAtom)

  return isSearchOpen
}
