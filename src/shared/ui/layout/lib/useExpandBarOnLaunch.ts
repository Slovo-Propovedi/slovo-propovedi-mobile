import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import { setBarCollapsed } from '../model'

// `isBarCollapsedAtom` lives in memory only, and on Android the media service
// keeps the JS process alive after a swipe from recents. A new activity then
// mounts the root layout with the previous run's collapsed flag still set, so
// every launch expands the bar once. A background→foreground return does not
// remount the root, so it keeps whatever state the user left behind.
export const useExpandBarOnLaunch = () => {
  const expandBar = useAction(setBarCollapsed)

  useEffect(() => {
    expandBar(false)
  }, [expandBar])
}
