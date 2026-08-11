import { type PlaylistData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapPlaylistSermonToSermonData } from './mapPlaylistSermonToSermonData'
import { mapSectionEntityToSectionData } from './mapSectionEntityToSectionData'

/**
 * Маппер: PlaylistEntity (API) -> PlaylistData (App).
 *
 * Конвертирует `sermons` из API в локальный формат.
 * @param apiPlaylist - Плейлист из API.
 */
export const mapPlaylistEntityToPlaylistData = (
  apiPlaylist: APITypes.PlaylistEntity,
): PlaylistData => ({
  artwork: apiPlaylist.artwork,
  description: apiPlaylist.description,
  id: apiPlaylist.id,
  sections: apiPlaylist.sections.map(mapSectionEntityToSectionData),
  sermons: apiPlaylist.sermons.map(mapPlaylistSermonToSermonData),
  title: apiPlaylist.title,
})
