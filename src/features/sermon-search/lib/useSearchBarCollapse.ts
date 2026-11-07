import { useAtom } from '@reatom/npm-react'
import { isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { useBarCollapseOnScroll } from 'shared/ui/layout'
import { isSearchOpenAtom } from '../model'

// Results scrolling collapses the floating bottom bar, unless the search
// surface or the expanded player already owns that state.
export const useSearchBarCollapse = () => {
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)

  return useBarCollapseOnScroll({ isSuspended: isSearchOpen || isPlayerExpanded })
}
