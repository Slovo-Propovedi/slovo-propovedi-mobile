import { type APITypes } from 'shared/api'
import { playlistsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** Recently opened playlists by id. */
export const playlistDetailCache = createSessionCache<APITypes.PlaylistEntity>({
  maxEntries: 20,
  name: 'adminPlaylistDetail',
  schema: playlistsSchemas.PlaylistControllerFindOne200Response,
})
