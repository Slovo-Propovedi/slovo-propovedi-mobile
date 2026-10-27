import { type APITypes } from 'shared/api'
import { featureFlagsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Recently opened feature flags by id (`null` — the flag is gone). */
export const flagDetailCache = createSessionCache<APITypes.FeatureFlag | null>({
  maxEntries: 20,
  name: 'adminFlagDetail',
  schema:
    featureFlagsSchemas.FeatureFlagsControllerFindAll200Response.shape.flags.element.nullable(),
})
