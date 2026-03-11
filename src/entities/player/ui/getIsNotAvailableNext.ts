import type { PlaylistData } from 'shared/types'

export const getIsNotAvailableNext = (
  currentPlaylist: null | PlaylistData,
  indexOfCurrentAudioInPlaylist: number | undefined,
): boolean => {
  if (!currentPlaylist) return false
  return indexOfCurrentAudioInPlaylist === currentPlaylist.list.length - 1
}
