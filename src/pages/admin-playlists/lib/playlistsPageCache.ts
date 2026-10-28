import { type APITypes } from 'shared/api'
import { playlistsSchemas } from 'shared/api/generated'
import { createSessionCache } from 'shared/lib/session-cache'

/** First page of the admin playlists list per search/sort combination. */
export const playlistsPageCache = createSessionCache<APITypes.PlaylistEntity[]>({
  maxEntries: 10,
  name: 'adminPlaylistsPage',
  schema: playlistsSchemas.PlaylistControllerFindAll200Response.shape.playlists,
})
