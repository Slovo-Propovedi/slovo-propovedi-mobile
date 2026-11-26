import { useAction, useCtx } from '@reatom/npm-react'
import { useEffect, useRef } from 'react'
import { Keyboard } from 'react-native'
import {
  focusSearchInput,
  isSearchRoutePath,
  resetSearchSession,
} from 'features/sermon-search/@x/barMorph'
import { searchSessionNonceAtom } from '../model/searchSession'

/**
 * Syncs the search session with the `/search` route ownership of the screen.
 *
 * Entering the search route focuses the page-hosted field: the input no longer
 * lives in the bottom island, so opening search must hand it focus itself.
 * While the router path stays `/search` (or a nested `/search/*` detail) the
 * session survives a detail push, so the focus request is not repeated.
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
  const resetSession = useAction(resetSearchSession)
  const requestFocus = useAction(focusSearchInput)
  const wasSearchRef = useRef(false)

  useEffect(() => {
    const isSearch = isSearchRoutePath(pathname)
    const wasSearch = wasSearchRef.current
    wasSearchRef.current = isSearch

    if (!wasSearch && isSearch) {
      requestFocus()
      return
    }

    if (!wasSearch || isSearch) return

    void resetSession()
    searchSessionNonceAtom(ctx, ctx.get(searchSessionNonceAtom) + 1)
    Keyboard.dismiss()
  }, [pathname, ctx, requestFocus, resetSession])
}
