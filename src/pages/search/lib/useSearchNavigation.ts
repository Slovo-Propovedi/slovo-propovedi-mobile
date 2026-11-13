import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { closeSearch } from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { useNavigationGuard } from 'shared/routing'

/**
 * Navigation out of the search overlay. The gate stays mounted over every tab
 * screen, so a route is pushed only after the session closes; the guard collapses
 * a rapid double tap into one push. Extracted from `SearchGate` to keep it inside
 * the file-size limit.
 */
export const useSearchNavigation = () => {
  const closeSearchAction = useAction(closeSearch)
  const router = useRouter()
  const runGuarded = useNavigationGuard()

  const navigateToPlaylist = useCallback(
    (playlist: PlaylistData) => {
      runGuarded(async () => {
        await closeSearchAction()
        router.push({
          params: { playlist: playlist.id },
          pathname: '/listen/playlist',
        })
      })
    },
    [closeSearchAction, router, runGuarded],
  )

  const navigateToPreacher = useCallback(
    (artist: string) => {
      runGuarded(async () => {
        await closeSearchAction()
        router.push({
          params: { artist },
          pathname: '/listen/preacher',
        })
      })
    },
    [closeSearchAction, router, runGuarded],
  )

  return { navigateToPlaylist, navigateToPreacher }
}
