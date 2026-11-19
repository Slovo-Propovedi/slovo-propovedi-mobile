import { useCtx } from '@reatom/npm-react'
import { useState } from 'react'
import { oneLineBarMorphDriver } from 'widgets/tab-bar/@x/morph'
import { setBarCollapsed } from 'shared/ui/layout'

// `isBarCollapsedAtom` lives in memory only, and on Android the media service
// keeps the JS process alive after a swipe from recents. A new activity then
// remounts the root with the previous run's collapsed flag still set.
export const useLaunchBarState = () => {
  const ctx = useCtx()

  // The reset must run in the ROOT's render phase — before the chrome children
  // seed `settled` from the atom — or the first frame paints the collapsed
  // geometry and then jumps. An effect (even a layout one) fires after the
  // children have already seeded. The same contract as useAtomMorphDriver.seed.
  useState(() => {
    setBarCollapsed(ctx, false)
    oneLineBarMorphDriver.snap(ctx)

    return null
  })
}
