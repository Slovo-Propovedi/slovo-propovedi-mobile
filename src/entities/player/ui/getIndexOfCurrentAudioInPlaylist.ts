import type { AudioPlayerData } from './PlayerControls.types'
import type { PlaylistData } from 'shared/types'

export const getIndexOfCurrentAudioInPlaylist = (
  currentAudio: AudioPlayerData | null,
  currentPlaylist: null | PlaylistData,
): number | undefined => {
  if (!currentAudio || !currentPlaylist) return undefined
  return currentPlaylist.list.findIndex(({ id }) => currentAudio.id === id)
}
