import { useCtx } from '@reatom/npm-react'
import { useLayoutEffect } from 'react'
import { setBarCollapsed } from 'shared/ui/layout'
import { barMorphDriver } from './barMorphDriver'

// `isBarCollapsedAtom` lives in memory only, and on Android the media service
// keeps the JS process alive after a swipe from recents. A new activity then
// remounts the root with the previous run's collapsed flag still set, so every
// launch must expand the bar. The expansion lands BEFORE the first paint and
// snaps the bar morph instead of sliding it: a post-paint `useEffect` showed the
// collapsed shade/pill geometry for the first visible frames and then jumped.
export const useLaunchBarState = () => {
  const ctx = useCtx()

  useLayoutEffect(() => {
    setBarCollapsed(ctx, false)
    barMorphDriver.snap(ctx)
  }, [ctx])
}
