import { useAction } from '@reatom/npm-react'
import { usePathname, useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Keyboard } from 'react-native'
import { isSearchOpenAtom } from '../model'
import { resetSearchSession } from '../model-session'

// A nested detail (`/search/playlist`, `/search/preacher`) sits inside the
// search route: popping it would leave search open, so the ✕ has to leave the
// route itself.
const isSearchDetailPath = (pathname: string): boolean => pathname.startsWith('/search/')

/**
 * Closes the whole search: clears the session in one transaction, dismisses the
 * keyboard and leaves the search route. The open flag is written before
 * navigation so the closing morph starts on the press tick instead of waiting
 * for the pathname effect (which then no-ops and reconciles back/tab-switch
 * paths). Under a nested detail `back()` would only pop the detail, so the
 * listen tab is navigated to directly; otherwise `back()` pops the route, or
 * `navigate('/listen')` covers a deep link with no history.
 * @returns Stable close callback shared by the external ✕ and the Escape path.
 */
export const useCloseSearch = () => {
  const pathname = usePathname()
  const router = useRouter()
  const setSearchOpen = useAction(isSearchOpenAtom)
  const resetSession = useAction(resetSearchSession)

  return useCallback(() => {
    Keyboard.dismiss()
    setSearchOpen(false)
    void resetSession()

    if (isSearchDetailPath(pathname)) {
      router.navigate('/listen')
      return
    }

    if (router.canGoBack()) {
      router.back()
      return
    }

    router.navigate('/listen')
  }, [pathname, resetSession, router, setSearchOpen])
}
