import { type PlaylistData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapPlaylistEntities } from './mapPlaylistEntities'

/**
 * Маппер ответа API: AllPlaylistsResponse -> PlaylistData[].
 * @param response - Ответ API с плейлистами.
 */
export const mapAllPlaylistsResponse = (response: APITypes.AllPlaylistsResponse): PlaylistData[] =>
  mapPlaylistEntities(response.playlists ?? [])
