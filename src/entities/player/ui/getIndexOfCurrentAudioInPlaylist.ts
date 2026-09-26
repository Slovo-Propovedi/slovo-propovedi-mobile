import { type PlaylistData } from 'entities/playlist/@x/player'
import type { AudioPlayerData } from 'entities/sermon'

export const getIndexOfCurrentAudioInPlaylist = (
  currentAudio: AudioPlayerData | null,
  currentPlaylist: null | PlaylistData,
): number | undefined => {
  if (!currentAudio || !currentPlaylist) return undefined
  return currentPlaylist.sermons?.findIndex(({ id }) => currentAudio.id === id)
}
