import z from 'zod'
import { type APITypes } from 'shared/api'
import { sectionsSchemas } from 'shared/api/generated'

const sectionEntitySchema =
  sectionsSchemas.SectionControllerFindAll200Response.shape.sections.element

export const sectionListItemSchema = sectionEntitySchema
  .pick({
    description: true,
    id: true,
    itemsSize: true,
    title: true,
    transform: true,
  })
  .extend({ playlistsCount: z.number().int().nonnegative() })

export type AdminSectionListItem = z.infer<typeof sectionListItemSchema>

export const toSectionListItem = (section: APITypes.SectionEntity): AdminSectionListItem => ({
  description: section.description ?? null,
  id: section.id,
  itemsSize: section.itemsSize,
  playlistsCount: section.playlists.length,
  title: section.title,
  transform: section.transform,
})
