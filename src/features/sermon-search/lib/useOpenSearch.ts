import { useAction } from '@reatom/npm-react'
import { usePathname, useRouter } from 'expo-router'
import { useCallback } from 'react'
import { focusSearchInput } from '../model-searchField'
import { openSearch } from '../model-session'

const SEARCH_ROUTE_PATH = '/search'

/**
 * Opens the search route from the closed search circle.
 *
 * The bar expands in the press tick, before navigation, so it does not expand a
 * frame late on the new screen. The page focuses its own field when the route
 * opens (`useClearSearchOnLeave`). On the search index itself, the circle only
 * expands the bar and focuses the page field instead of re-navigating; from a
 * nested detail it still navigates back to the index that owns the field.
 * @returns Stable callback shared by the compact circle and the wide slot.
 */
export const useOpenSearch = () => {
  const router = useRouter()
  const pathname = usePathname()
  const openSearchAction = useAction(openSearch)
  const requestFocus = useAction(focusSearchInput)

  return useCallback(() => {
    openSearchAction()

    if (pathname === SEARCH_ROUTE_PATH) {
      requestFocus()
      return
    }

    router.navigate(SEARCH_ROUTE_PATH)
  }, [pathname, openSearchAction, requestFocus, router])
}
