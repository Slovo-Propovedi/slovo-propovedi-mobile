import { type PlaylistData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapPlaylistSermonToSermonData } from './mapPlaylistSermonToSermonData'
import { mapSectionRefToSectionData } from './mapSectionRefToSectionData'

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
  sermons: apiPlaylist.sermons.map(mapPlaylistSermonToSermonData),
  title: apiPlaylist.title,
})
