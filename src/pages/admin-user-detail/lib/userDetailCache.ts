import { type APITypes } from 'shared/api'
import { usersSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Recently opened users by id. */
export const userDetailCache = createSessionCache<APITypes.UserResponse>({
  maxEntries: 20,
  name: 'adminUserDetail',
  schema: usersSchemas.UsersControllerFindOne200Response,
  sensitive: true,
})
