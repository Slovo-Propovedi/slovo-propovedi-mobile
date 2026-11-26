// Router-wide path, not the nearest navigator's route name: the search page is
// an `index` screen inside its own stack, so a navigator-local state would
// report `index` instead of the route that owns the tabs navigator.
export const isSearchRoutePath = (pathname: string) =>
  pathname === '/search' || pathname.startsWith('/search/')
