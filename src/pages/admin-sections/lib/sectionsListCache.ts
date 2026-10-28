import { type APITypes } from 'shared/api'
import { sectionsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Admin sections list. */
export const sectionsListCache = createSessionCache<APITypes.SectionEntity[]>({
  maxEntries: 1,
  name: 'adminSections',
  schema: sectionsSchemas.SectionControllerFindAll200Response.shape.sections,
})
