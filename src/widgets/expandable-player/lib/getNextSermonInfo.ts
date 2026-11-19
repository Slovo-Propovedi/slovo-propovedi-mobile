import { type PlaylistData } from 'entities/playlist'

interface NextSermonInfo {
  hasNext: boolean
  title: string | undefined
}

// The sermon that follows the current one in the playing playlist, if any —
// shown as the "next" hint in the fullscreen header.
export const getNextSermonInfo = (playlist: PlaylistData, audioId: string): NextSermonInfo => {
  const currentIndex = playlist.sermons.findIndex(sermon => sermon.id === audioId)
  // `findIndex` returns -1 for a track outside the playlist (stale atom during a
  // native switch); the first sermon must not be reported as "next".
  if (currentIndex === -1) return { hasNext: false, title: undefined }

  const nextSermon = playlist.sermons[currentIndex + 1]

  return {
    hasNext: currentIndex < playlist.sermons.length - 1,
    title: nextSermon?.title,
  }
}
