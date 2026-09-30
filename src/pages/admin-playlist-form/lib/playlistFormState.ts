import { type APITypes } from 'shared/api'

export interface PlaylistFormValues {
  artwork: string
  description: string
  selectedSectionIds: string[]
  selectedSermonIds: string[]
  title: string
}

export const initialFormValues = (
  initial?: APITypes.PlaylistEntity | null,
): PlaylistFormValues => ({
  artwork: initial?.artwork ?? '',
  description: initial?.description ?? '',
  selectedSectionIds: initial?.sections.map(section => section.id) ?? [],
  selectedSermonIds: initial?.sermons.map(sermon => sermon.id) ?? [],
  title: initial?.title ?? '',
})

const buildCommonFields = (values: PlaylistFormValues) => ({
  artwork: values.artwork.trim(),
  description: values.description.trim() || null,
  sectionsIds: values.selectedSectionIds,
  sermonsIds: values.selectedSermonIds,
  title: values.title.trim(),
})

export const buildCreatePlaylistDto = (values: PlaylistFormValues): APITypes.CreatePlaylistDto =>
  buildCommonFields(values)

export const buildUpdatePlaylistDto = (values: PlaylistFormValues): APITypes.UpdatePlaylistDto =>
  buildCommonFields(values)
