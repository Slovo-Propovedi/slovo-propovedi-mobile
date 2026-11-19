import { useState } from 'react'
import { SEARCH_ROUTE_NAME } from './getVisibleTabRoutes'

interface TabRoute {
  key: string
  name: string
}

/**
 * Key of the tab that owns the active capsule and the collapsed circle.
 *
 * `/search` is registered in the tabs navigator (it owns its detail stack) but
 * the bar never renders it as a slot, so while it is focused `state.index`
 * points at a route with no button. HEAD kept the underlying tab active (search
 * was an overlay); the route model remembers the last visible tab so opening
 * search never blanks the active circle. A deep link straight to `/search` has
 * no previous tab and falls back to the first visible one — the tab that
 * `backBehavior: 'firstRoute'` would return to.
 * @param routes - Navigator routes, including the filtered search route.
 * @param index - Index of the focused route.
 */
export const useActiveTabRouteKey = (routes: readonly TabRoute[], index: number) => {
  const focusedRoute = routes[index]
  const focusedTab = focusedRoute?.name === SEARCH_ROUTE_NAME ? undefined : focusedRoute
  const [lastVisibleKey, setLastVisibleKey] = useState<null | string>(() => focusedTab?.key ?? null)

  // Adjusting state during render is the sanctioned way to remember the previous
  // tab: React re-renders immediately, before children, so the key is ready when
  // `/search` focuses instead of a frame later in an effect.
  if (focusedTab !== undefined && focusedTab.key !== lastVisibleKey)
    setLastVisibleKey(focusedTab.key)

  return (
    focusedTab?.key ?? lastVisibleKey ?? routes.find(route => route.name !== SEARCH_ROUTE_NAME)?.key
  )
}
