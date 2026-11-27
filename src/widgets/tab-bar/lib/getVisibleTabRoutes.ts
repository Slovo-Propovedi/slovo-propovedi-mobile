import { type Tabs } from 'expo-router'

type TabRoutes = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0]['state']['routes']

// The `/search` route is registered in the tabs navigator (it owns its nested
// detail stack), but the bar does not render it as a routed tab slot: search is
// drawn as its own full tab-like slot (label, shared width, active capsule) on
// top of the routed ones. Counting only these routed slots keeps the island's
// per-tab width correct.
export const SEARCH_ROUTE_NAME = 'search'

export const getVisibleTabRoutes = (routes: TabRoutes) =>
  routes.filter(route => route.name !== SEARCH_ROUTE_NAME)
