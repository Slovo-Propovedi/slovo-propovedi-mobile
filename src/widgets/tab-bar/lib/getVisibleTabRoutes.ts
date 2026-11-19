import { type Tabs } from 'expo-router'

type TabRoutes = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0]['state']['routes']

// The `/search` route is registered in the tabs navigator (it owns its nested
// detail stack), but it is NOT a tab slot: the bar always shows the three real
// tabs and the search pill opens that route. Counting only these slots keeps the
// island's per-tab width correct.
export const SEARCH_ROUTE_NAME = 'search'

export const getVisibleTabRoutes = (routes: TabRoutes) =>
  routes.filter(route => route.name !== SEARCH_ROUTE_NAME)
