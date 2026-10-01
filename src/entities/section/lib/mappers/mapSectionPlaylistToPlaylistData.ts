import { mapPlaylistSermonToSermonShape, type PlaylistData } from 'entities/playlist/@x/section'
import { type APITypes } from 'shared/api'
import { mapSectionRefToSectionData } from './mapSectionRefToSectionData'

/**
 * Маппер: SectionPlaylist (API) -> PlaylistData (App).
 *
 * Живёт в `entities/section`, т.к. Его единственный потребитель —
 * `mapSectionEntityToSectionData` (секция резолвит свои плейлисты). Раньше
 * лежал в `entities/playlist` и импортировался обратно через
 * `playlist/@x/section`, что после выноса `mapSectionEntityToSectionData`
 * в `section/@x/playlist` замкнуло require-цикл section ↔ playlist.
 * @param apiPlaylist - Плейлист внутри секции из API.
 */
export const mapSectionPlaylistToPlaylistData = (
  apiPlaylist: APITypes.SectionPlaylist,
): PlaylistData => ({
  artwork: apiPlaylist.artwork ?? null,
  description: apiPlaylist.description ?? undefined,
  id: apiPlaylist.id,
  sections: apiPlaylist.sections.map(mapSectionRefToSectionData),
  sermons: apiPlaylist.sermons.map(mapPlaylistSermonToSermonShape),
  title: apiPlaylist.title,
})
