import { mapSectionRefToSectionData } from 'entities/section/@x/playlist'
import { type APITypes } from 'shared/api'
import { type PlaylistData } from '../../model'
import { mapPlaylistSermonToSermonShape } from './mapPlaylistSermonToSermonShape'

/**
 * Маппер: SectionPlaylist (API) -> PlaylistData (App).
 * @param apiPlaylist - Плейлист внутри секции из API.
 */
export const mapSectionPlaylistToPlaylistData = (
  apiPlaylist: APITypes.SectionPlaylist,
): PlaylistData => ({
  artwork: apiPlaylist.artwork,
  description: apiPlaylist.description,
  id: apiPlaylist.id,
  sections: apiPlaylist.sections.map(mapSectionRefToSectionData),
  sermons: apiPlaylist.sermons.map(mapPlaylistSermonToSermonShape),
  title: apiPlaylist.title,
})
