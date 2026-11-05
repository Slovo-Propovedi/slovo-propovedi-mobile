import z from 'zod'
import { createSessionCache } from 'shared/lib/session-cache'
import { type AdminSectionListItem, sectionListItemSchema } from './sectionListItem'

/** Admin sections list. */
export const sectionsListCache = createSessionCache<AdminSectionListItem[]>({
  maxEntries: 1,
  name: 'adminSectionsListV2',
  schema: z.array(sectionListItemSchema),
})
