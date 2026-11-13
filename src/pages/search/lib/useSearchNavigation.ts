import { useCtx } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { type PlaylistData } from 'entities/playlist'
import { isScreenTransitioningAtom } from 'shared/model'
import { useNavigationGuard } from 'shared/routing'

/**
 * Navigation out of the search results. The search overlay stays mounted
 * underneath the pushed route (SearchGate conceals it only after the push
 * transition ends), so back restores the exact session state; the guard collapses
 * a rapid double tap into one push. Extracted from `SearchGate` to keep it inside
 * the file-size limit.
 */
export const useSearchNavigation = () => {
  const ctx = useCtx()
  const router = useRouter()
  const runGuarded = useNavigationGuard()

  const navigateToPlaylist = useCallback(
    (playlist: PlaylistData) => {
      runGuarded(() => {
        isScreenTransitioningAtom(ctx, true)
        router.push({
          params: { playlist: playlist.id },
          pathname: '/listen/playlist',
        })
      })
    },
    [ctx, router, runGuarded],
  )

  const navigateToPreacher = useCallback(
    (artist: string) => {
      runGuarded(() => {
        isScreenTransitioningAtom(ctx, true)
        router.push({
          params: { artist },
          pathname: '/listen/preacher',
        })
      })
    },
    [ctx, router, runGuarded],
  )

  return { navigateToPlaylist, navigateToPreacher }
}
