import { useAtom } from '@reatom/npm-react'
import { isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { useBarCollapseOnScroll } from 'shared/ui/layout'
import { useIsSearchBarCollapseSuspended } from './useIsSearchBarCollapseSuspended'

// Results scrolling collapses the floating bottom bar, unless the expanded
// player owns that state or an active query pins the search field in place.
export const useSearchBarCollapse = () => {
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)
  const isSearchBarCollapseSuspended = useIsSearchBarCollapseSuspended()

  return useBarCollapseOnScroll({
    isSuspended: isPlayerExpanded || isSearchBarCollapseSuspended,
  })
}
