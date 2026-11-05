import z from 'zod'
import { createSessionCache } from 'shared/lib/session-cache'
import { type AdminPlaylistsListItem, playlistListItemSchema } from './playlistListItem'

/** First page of the admin playlists list per search/sort combination. */
export const playlistsPageCache = createSessionCache<AdminPlaylistsListItem[]>({
  maxEntries: 10,
  name: 'adminPlaylistsPageV2',
  schema: z.array(playlistListItemSchema),
})
