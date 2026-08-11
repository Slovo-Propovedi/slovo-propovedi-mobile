import { type PlaylistData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapPlaylistEntityToPlaylistData } from './mapPlaylistEntityToPlaylistData'

/**
 * Маппер массива: PlaylistEntity[] -> PlaylistData[].
 * @param apiPlaylists - Массив плейлистов из API.
 */
export const mapPlaylistEntities = (apiPlaylists: APITypes.PlaylistEntity[]): PlaylistData[] =>
  apiPlaylists.map(mapPlaylistEntityToPlaylistData)
