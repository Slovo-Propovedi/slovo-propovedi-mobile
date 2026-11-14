// Tab roots are the screens the search overlay itself covers. Any other route
// is a screen pushed on top of it, so the overlay must hide (without unmounting)
// until back returns to a tab root.
const TAB_ROOT_ROUTES = new Set(['/listen', '/more', '/read'])

/**
 * Whether a route pushed over the search overlay currently owns the screen.
 * SearchGate keeps the session mounted underneath these routes so the query,
 * active group and loaded pages survive the detour.
 * @param pathname - Current `usePathname()` value (query strings are stripped).
 */
export const isDetailRouteOverSearch = (pathname: string): boolean => !TAB_ROOT_ROUTES.has(pathname)
