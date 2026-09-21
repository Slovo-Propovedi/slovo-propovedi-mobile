import { type SectionData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapSectionPlaylistToPlaylistData } from './mapSectionPlaylistToPlaylistData'

/**
 * Нормализует itemsRows из API перед передачей в слайдер.
 * @param itemsRows - Количество рядов (может отсутствовать или быть null).
 */
export const normalizeItemsRows = (itemsRows?: null | number): number | undefined => {
  // The server may send itemsRows=0/negative; the legacy algorithm degraded
  // such values to a single row, but dividing by them yields Infinity/negative
  // column counts and crashes the virtualized slider (RangeError). Clamp to a
  // sane minimum; absent/null keep their meaning — Slider defaults to 1 row.
  if (typeof itemsRows !== 'number' || !Number.isFinite(itemsRows)) return undefined
  return Math.max(1, Math.floor(itemsRows))
}

/**
 * Маппер: SectionEntity (API) -> SectionData (App).
 * @param apiSection - Секция из API.
 */
export const mapSectionEntityToSectionData = (apiSection: APITypes.SectionEntity): SectionData => ({
  borderRadius: apiSection.borderRadius,
  description: apiSection.description,
  id: apiSection.id,
  isDescriptionTitleOnSlideLarge: apiSection.isDescriptionTitleOnSlideLarge,
  itemsRows: normalizeItemsRows(apiSection.itemsRows),
  itemsSize: apiSection.itemsSize,
  playlists: apiSection.playlists.map(mapSectionPlaylistToPlaylistData),
  title: apiSection.title,
  transform: apiSection.transform,
  whereIsSlideTitleLocated: apiSection.whereIsSlideTitleLocated,
})
