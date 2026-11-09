import { useBarCollapseOnScroll } from 'shared/ui/layout'
import { useIsBarCollapseSuspended } from './useIsBarCollapseSuspended'

// Results scrolling collapses the floating bottom bar only while the mini
// player is on screen; the expanded player or an active query pauses the driver.
export const useSearchBarCollapse = () => {
  const isSuspended = useIsBarCollapseSuspended()

  return useBarCollapseOnScroll({ isSuspended })
}
