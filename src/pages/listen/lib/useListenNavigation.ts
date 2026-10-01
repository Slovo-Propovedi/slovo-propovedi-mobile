import { useRouter } from 'expo-router'
import { type PlaylistData } from 'entities/playlist'

export const useListenNavigation = () => {
  const router = useRouter()

  const navigateToPlaylist = (playlist: PlaylistData) => {
    router.push({
      params: { playlist: playlist.id },
      pathname: '/listen/playlist',
    })
  }

  const navigateToPlaylistList = (sectionId: string) => {
    router.push({
      params: { sectionId },
      pathname: '/listen/playlist-list',
    })
  }

  const navigateToMyPlaylists = () => {
    router.push({ pathname: '/listen/my-playlists' })
  }

  return {
    navigateToMyPlaylists,
    navigateToPlaylist,
    navigateToPlaylistList,
  }
}
