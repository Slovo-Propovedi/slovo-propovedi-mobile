import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { type PlaylistData } from 'entities/playlist'
import { useNavigationGuard } from 'shared/routing'

/**
 * Navigation out of the search results. The search overlay stays mounted
 * underneath the pushed route (SearchGate hides it by pathname), so back
 * restores the exact session state; the guard collapses a rapid double tap into
 * one push. Extracted from `SearchGate` to keep it inside the file-size limit.
 */
export const useSearchNavigation = () => {
  const router = useRouter()
  const runGuarded = useNavigationGuard()

  const navigateToPlaylist = useCallback(
    (playlist: PlaylistData) => {
      runGuarded(() => {
        router.push({
          params: { playlist: playlist.id },
          pathname: '/listen/playlist',
        })
      })
    },
    [router, runGuarded],
  )

  const navigateToPreacher = useCallback(
    (artist: string) => {
      runGuarded(() => {
        router.push({
          params: { artist },
          pathname: '/listen/preacher',
        })
      })
    },
    [router, runGuarded],
  )

  return { navigateToPlaylist, navigateToPreacher }
}
