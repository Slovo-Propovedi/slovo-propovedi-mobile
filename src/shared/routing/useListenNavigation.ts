import { useRouter } from 'expo-router'
import { type PlaylistData } from '../model/domain/common'

export const useListenNavigation = () => {
  const router = useRouter()

  const navigateToPlaylist = (playlist: PlaylistData) => {
    router.push({
      params: { playlist: JSON.stringify(playlist) },
      pathname: '/listen/playlist',
    })
  }

  const navigateToPlaylistList = (sectionId: string, title: string) => {
    router.push({
      params: { sectionId, title },
      pathname: '/listen/playlist-list',
    })
  }

  return {
    navigateToPlaylist,
    navigateToPlaylistList,
  }
}
