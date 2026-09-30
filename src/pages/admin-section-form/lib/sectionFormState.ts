import { type APITypes } from 'shared/api'

export interface SectionFormValues {
  borderRadius: boolean
  description: string
  isDescriptionTitleOnSlideLarge: boolean
  itemsRows: string
  itemsSize: APITypes.CreateSectionDtoItemsSize
  selectedPlaylistIds: string[]
  title: string
  transform: APITypes.CreateSectionDtoTransform
  whereIsSlideTitleLocated: APITypes.CreateSectionDtoWhereIsSlideTitleLocated
}

export const initialFormValues = (initial?: APITypes.SectionEntity | null): SectionFormValues => ({
  borderRadius: initial?.borderRadius ?? false,
  description: initial?.description ?? '',
  isDescriptionTitleOnSlideLarge: initial?.isDescriptionTitleOnSlideLarge ?? false,
  itemsRows: initial?.itemsRows == null ? '' : String(initial.itemsRows),
  itemsSize: initial?.itemsSize ?? 'middle',
  selectedPlaylistIds: initial?.playlists.map(playlist => playlist.id) ?? [],
  title: initial?.title ?? '',
  transform: initial?.transform ?? 'high',
  whereIsSlideTitleLocated: initial?.whereIsSlideTitleLocated ?? 'on',
})

const parseItemsRows = (value: string): null | number => {
  const trimmed = value.trim()
  if (trimmed === '') return null

  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

const buildCommonFields = (values: SectionFormValues) => ({
  borderRadius: values.borderRadius,
  description: values.description.trim() || null,
  isDescriptionTitleOnSlideLarge: values.isDescriptionTitleOnSlideLarge,
  itemsRows: parseItemsRows(values.itemsRows),
  itemsSize: values.itemsSize,
  title: values.title.trim(),
  transform: values.transform,
  whereIsSlideTitleLocated: values.whereIsSlideTitleLocated,
})

export const buildCreateSectionDto = (values: SectionFormValues): APITypes.CreateSectionDto =>
  buildCommonFields(values)

export const buildUpdateSectionDto = (values: SectionFormValues): APITypes.UpdateSectionDto => ({
  ...buildCommonFields(values),
  playlistsIds: values.selectedPlaylistIds,
})
