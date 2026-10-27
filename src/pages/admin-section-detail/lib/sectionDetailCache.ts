import { type APITypes } from 'shared/api'
import { sectionsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Recently opened sections by id. */
export const sectionDetailCache = createSessionCache<APITypes.SectionEntity>({
  maxEntries: 20,
  name: 'adminSectionDetail',
  schema: sectionsSchemas.SectionControllerFindOne200Response,
})
