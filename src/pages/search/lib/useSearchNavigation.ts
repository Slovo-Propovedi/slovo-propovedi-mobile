import { useCtx } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { type PlaylistData } from 'entities/playlist'
import { isScreenTransitioningAtom } from 'shared/model'
import { useNavigationGuard } from 'shared/routing'

/**
 * Navigation out of the search results. The detail routes live INSIDE the
 * search route (`/search/playlist`, `/search/preacher`), so back pops them and
 * the results — with the query, group and loaded pages — stay untouched; the
 * route-leave reset never fires for a push inside search. The guard collapses
 * a rapid double tap into one push.
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
          pathname: '/search/playlist',
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
          pathname: '/search/preacher',
        })
      })
    },
    [ctx, router, runGuarded],
  )

  return { navigateToPlaylist, navigateToPreacher }
}
