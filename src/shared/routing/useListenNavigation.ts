import { useRouter } from 'expo-router'

/**
 * Минимальная структурная форма плейлиста, нужная навигации.
 * Shared не импортирует entities, поэтому принимаем только id.
 */
interface NavigablePlaylist {
  id: string
}

export const useListenNavigation = () => {
  const router = useRouter()

  const navigateToPlaylist = (playlist: NavigablePlaylist) => {
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

  return {
    navigateToPlaylist,
    navigateToPlaylistList,
  }
}
