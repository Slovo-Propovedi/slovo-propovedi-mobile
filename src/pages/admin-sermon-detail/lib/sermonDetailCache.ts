import { type APITypes } from 'shared/api'
import { sermonsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Recently opened sermons by id. */
export const sermonDetailCache = createSessionCache<APITypes.SermonEntity>({
  maxEntries: 20,
  name: 'adminSermonDetail',
  schema: sermonsSchemas.SermonControllerFindOne200Response,
})
