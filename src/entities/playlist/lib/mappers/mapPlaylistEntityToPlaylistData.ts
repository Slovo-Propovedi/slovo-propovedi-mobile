import { mapSectionEntityToSectionData } from 'entities/section/@x/playlist'
import { type APITypes } from 'shared/api'
import { type PlaylistData } from '../../model'
import { mapPlaylistSermonToSermonShape } from './mapPlaylistSermonToSermonShape'

/**
 * Маппер: PlaylistEntity (API) -> PlaylistData (App).
 *
 * Конвертирует `sermons` из API в локальный формат.
 * @param apiPlaylist - Плейлист из API.
 */
export const mapPlaylistEntityToPlaylistData = (
  apiPlaylist: APITypes.PlaylistEntity,
): PlaylistData => ({
  artwork: apiPlaylist.artwork ?? null,
  description: apiPlaylist.description ?? undefined,
  id: apiPlaylist.id,
  sections: apiPlaylist.sections.map(mapSectionEntityToSectionData),
  sermons: apiPlaylist.sermons.map(mapPlaylistSermonToSermonShape),
  title: apiPlaylist.title,
})
