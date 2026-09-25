import { mapPlaylistEntityToPlaylistData, playlistsApi } from 'shared/api'
import { type PlaylistData } from 'shared/model'

export const resolvePlaylistFromApi = async (
  playlistId: string,
): Promise<PlaylistData | undefined> => {
  try {
    const entity = await playlistsApi.getPlaylists().playlistControllerFindOne(playlistId)
    return mapPlaylistEntityToPlaylistData(entity)
  } catch (error) {
    console.error('resolvePlaylistFromApi failed:', error)
    return undefined
  }
}
