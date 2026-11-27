import { SEARCH_ROUTE_NAME } from './getVisibleTabRoutes'

interface TabRoute {
  key: string
  name: string
}

// The fallback tab that fills the collapsed circle while `/search` owns the
// navigator: search is a separate circle in the split row, so the tab circle
// shows the default section. «Слушать» is the app's home tab.
const LISTEN_ROUTE_NAME = 'listen'

/**
 * Key of the tab that fills the collapsed circle.
 *
 * `/search` is registered in the tabs navigator (it owns its detail stack) but
 * it is not an ordinary tab slot in the route model. The collapsed compact row
 * splits into the tab circle and the search circle, so while search is focused
 * the tab circle falls back to the «Слушать» tab — the first visible tab when
 * the layout has no listen route. That circle renders INACTIVE: search owns the
 * active capsule on its own circle and in the in-island search slot.
 * @param routes - Navigator routes, including the filtered search route.
 * @param index - Index of the focused route.
 */
export const useActiveTabRouteKey = (routes: readonly TabRoute[], index: number) => {
  const focusedRoute = routes[index]

  if (focusedRoute === undefined) return routes.find(route => route.name !== SEARCH_ROUTE_NAME)?.key

  if (focusedRoute.name !== SEARCH_ROUTE_NAME) return focusedRoute.key

  const visibleRoutes = routes.filter(route => route.name !== SEARCH_ROUTE_NAME)

  return (visibleRoutes.find(route => route.name === LISTEN_ROUTE_NAME) ?? visibleRoutes[0])?.key
}
