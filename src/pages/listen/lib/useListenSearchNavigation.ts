import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useListenNavigation } from './useListenNavigation'

type SearchResultsGroup = 'playlists' | 'preachers' | 'sermons'

/**
 * Navigation callbacks for the compact grouped search results. The routes live in
 * the pages layer: the feature only raises the intents, the page performs them.
 */
export const useListenSearchNavigation = () => {
  const router = useRouter()
  const { navigateToPlaylist } = useListenNavigation()

  const onShowAllGroup = useCallback(
    (group: SearchResultsGroup, query: string) => {
      router.push({ params: { query, type: group }, pathname: '/listen/search-results' })
    },
    [router],
  )

  const onPreacherPress = useCallback(
    (artist: string) => {
      router.push({
        params: { query: artist, type: 'sermons' },
        pathname: '/listen/search-results',
      })
    },
    [router],
  )

  return { onPlaylistPress: navigateToPlaylist, onPreacherPress, onShowAllGroup }
}
