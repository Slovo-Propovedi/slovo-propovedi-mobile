import { type Ctx } from '@reatom/framework'
import { setBarCollapsed } from 'shared/ui/layout'
import { barMorphDriver } from './barMorphDriver'

// `isBarCollapsedAtom` lives in memory only, and on Android the media service
// keeps the JS process alive after a swipe from recents. A new activity then
// remounts the root with the previous run's collapsed flag still set, so every
// launch must expand the bar. The correction runs at MODULE SCOPE of the app
// entry — before React renders anything — so every render-phase seed
// (`useAtomMorphDriver`'s settled initializer and `driver.seed`) reads the
// expanded atom and never the stale collapsed one.
export const expandBarOnLaunch = (ctx: Ctx): void => {
  setBarCollapsed(ctx, false)
  barMorphDriver.snap(ctx)
}
