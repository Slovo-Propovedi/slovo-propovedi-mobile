import { useRouter } from 'expo-router'
import type { PlaylistData } from 'shared/model'

export const useListenNavigation = () => {
  const router = useRouter()

  const navigateToPlaylist = (playlist: PlaylistData) => {
    router.push({
      params: { playlist: JSON.stringify(playlist) },
      pathname: '/listen/playlist',
    })
  }

  const navigateToPlaylistList = (playlists: PlaylistData[], title: string) => {
    router.push({
      params: { playlists: JSON.stringify(playlists), title },
      pathname: '/listen/playlist-list',
    })
  }

  const navigateToAudioPlayer = () => {
    router.push('/listen/audio-player')
  }

  return {
    navigateToAudioPlayer,
    navigateToPlaylist,
    navigateToPlaylistList,
  }
}
