import { type APITypes } from 'shared/api'
import { usersSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** First page of the admin users list (search is client-side, so one key). */
export const usersPageCache = createSessionCache<APITypes.UserResponse[]>({
  maxEntries: 1,
  name: 'adminUsersPage',
  schema: usersSchemas.UsersControllerFindAll200Response.shape.users,
  sensitive: true,
})
