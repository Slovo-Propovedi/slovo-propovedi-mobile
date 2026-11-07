import { type APITypes } from 'shared/api'
import { sermonsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** First page of the admin sermons list per search/sort combination. */
export const sermonsPageCache = createSessionCache<APITypes.SermonEntity[]>({
  maxEntries: 10,
  name: 'adminSermonsPage',
  schema: sermonsSchemas.SermonControllerFindAll200Response.shape.sermons,
})
