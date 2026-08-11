import { type SectionData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapSectionPlaylistToPlaylistData } from './mapSectionPlaylistToPlaylistData'

/**
 * Маппер: SectionEntity (API) -> SectionData (App).
 * @param apiSection - Секция из API.
 */
export const mapSectionEntityToSectionData = (apiSection: APITypes.SectionEntity): SectionData => ({
  borderRadius: apiSection.borderRadius,
  description: apiSection.description,
  id: apiSection.id,
  isDescriptionTitleOnSlideLarge: apiSection.isDescriptionTitleOnSlideLarge,
  itemsRows: apiSection.itemsRows,
  itemsSize: apiSection.itemsSize,
  playlists: apiSection.playlists.map(mapSectionPlaylistToPlaylistData),
  title: apiSection.title,
  transform: apiSection.transform,
  whereIsSlideTitleLocated: apiSection.whereIsSlideTitleLocated,
})
