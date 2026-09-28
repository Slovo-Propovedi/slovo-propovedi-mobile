import { type PlaylistData } from 'entities/playlist'

interface NextSermonInfo {
  hasNext: boolean
  title: string | undefined
}

// The sermon that follows the current one in the playing playlist, if any —
// shown as the "next" hint in the fullscreen header.
export const getNextSermonInfo = (playlist: PlaylistData, audioId: string): NextSermonInfo => {
  const currentIndex = playlist.sermons.findIndex(sermon => sermon.id === audioId)
  const nextSermon = playlist.sermons[currentIndex + 1]

  return {
    hasNext: currentIndex >= 0 && currentIndex < playlist.sermons.length - 1,
    title: nextSermon?.title,
  }
}
