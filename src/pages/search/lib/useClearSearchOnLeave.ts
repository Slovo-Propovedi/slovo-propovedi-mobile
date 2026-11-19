import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useRef } from 'react'
import { Keyboard } from 'react-native'
import { isSearchOpenAtom, resetSearchSession } from 'features/sermon-search/@x/barMorph'
import { searchSessionNonceAtom } from '../model/searchSession'

// The router-wide path, not the nearest navigator's route name: the search page
// is an `index` screen inside its own stack, so a navigator-local state would
// report `index` instead of the route that owns the tabs navigator.
const isSearchRoutePath = (pathname: string) =>
  pathname === '/search' || pathname.startsWith('/search/')

/**
 * Syncs the search session with the `/search` route ownership of the screen.
 *
 * While the router path is `/search` (or a nested `/search/*` detail) the flag
 * `isSearchOpenAtom` is true, so the field pill and the bar suspension stay
 * alive under a detail push — and the island morphs open exactly as it did when
 * the flag was the session switch.
 *
 * When the path leaves the search route, the whole session is reset in one
 * transaction (query, focus, input channel, page/scope state via the session
 * nonce) and the keyboard is dismissed. The reset is driven by the route, never
 * by a blur effect: a blur fires on pushes inside the search route too, and
 * those must keep the session intact.
 * @param pathname - Current `usePathname()` value (query strings stripped).
 */
export const useClearSearchOnLeave = (pathname: string) => {
  const ctx = useCtx()
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const resetSession = useAction(resetSearchSession)
  const wasSearchRef = useRef(isSearchOpen)

  useEffect(() => {
    const isSearch = isSearchRoutePath(pathname)
    // The atom write no-ops on an unchanged value, so the effect cannot loop.
    isSearchOpenAtom(ctx, isSearch)

    const wasSearch = wasSearchRef.current
    wasSearchRef.current = isSearch

    if (!wasSearch || isSearch) return

    void resetSession()
    searchSessionNonceAtom(ctx, ctx.get(searchSessionNonceAtom) + 1)
    Keyboard.dismiss()
  }, [pathname, ctx, resetSession])
}
