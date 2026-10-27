import { type APITypes } from 'shared/api'
import { featureFlagsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Admin feature flags list. */
export const flagsCache = createSessionCache<APITypes.FeatureFlag[]>({
  maxEntries: 1,
  name: 'adminFlags',
  schema: featureFlagsSchemas.FeatureFlagsControllerFindAll200Response.shape.flags,
})
