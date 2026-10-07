import { mapSectionEntityToSectionData } from 'entities/section/@x/playlist'
import { type APITypes } from 'shared/api'
import { nullIfEmpty } from 'shared/lib/utils/nullIfEmpty'
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
  artwork: nullIfEmpty(apiPlaylist.artwork),
  description: apiPlaylist.description ?? undefined,
  id: apiPlaylist.id,
  sections: apiPlaylist.sections.map(mapSectionEntityToSectionData),
  sermons: apiPlaylist.sermons.map(mapPlaylistSermonToSermonShape),
  title: apiPlaylist.title,
})
