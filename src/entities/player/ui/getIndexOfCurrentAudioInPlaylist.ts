import type { AudioPlayerData } from './PlayerControls.types'
import type { PlaylistData } from 'shared/model'

export const getIndexOfCurrentAudioInPlaylist = (
  currentAudio: AudioPlayerData | null,
  currentPlaylist: null | PlaylistData,
): number | undefined => {
  if (!currentAudio || !currentPlaylist) return undefined
  return currentPlaylist.sermons?.findIndex(({ id }) => currentAudio.id === id)
}
