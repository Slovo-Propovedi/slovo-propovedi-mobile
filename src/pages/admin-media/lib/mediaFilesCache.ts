import { type APITypes } from 'shared/api'
import { filesSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Admin media library catalog. */
export const mediaFilesCache = createSessionCache<APITypes.FileMetadataDto[]>({
  maxEntries: 1,
  name: 'adminMediaFiles',
  schema: filesSchemas.GetFiles200Response.shape.files,
})
