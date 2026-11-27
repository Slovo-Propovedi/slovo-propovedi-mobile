import { type TabBarProps } from './tabBarTypes'

interface InstantTabNavigationParams {
  descriptors: TabBarProps['descriptors']
  /** The navigator's queued `navigateToTab`, used when a descriptor is missing. */
  fallback: TabBarProps['navigateToTab']
  state: TabBarProps['state']
}

// Tab switches must land in the press's own React commit. The navigator's
// `navigateToTab` queues the action (expo-router: "Queues an action to be
// dispatched after the current React commit") and applies it in an effect, so the
// content swaps one whole navigation commit after the press. On native such a
// commit costs tens of milliseconds while web commits are cheap — only native
// visibly lags behind the bar. `dispatchSync` reduces the same NAVIGATE at once.
//
// The dispatcher is the focused route's descriptor: expo-router ignores actions
// coming from a preloaded screen, and the focused route is never a preload
// placeholder. A missing descriptor (placeholder tab route) falls back to the
// navigator's queued `navigateToTab`.
export const getInstantTabNavigation =
  ({ descriptors, fallback, state }: InstantTabNavigationParams): TabBarProps['navigateToTab'] =>
  routeKey => {
    const focusedRoute = state.routes[state.index]
    const target = descriptors[routeKey]
    const focused = focusedRoute ? descriptors[focusedRoute.key] : undefined

    if (!target || !focused) {
      fallback(routeKey)
      return
    }

    focused.navigation.dispatchSync({
      payload: { name: target.route.name, params: target.route.params },
      type: 'NAVIGATE',
    })
  }
