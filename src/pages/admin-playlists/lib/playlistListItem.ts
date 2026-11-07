import z from 'zod'
import { type APITypes } from 'shared/api'
import { playlistsSchemas } from 'shared/api/generated'

const playlistEntitySchema =
  playlistsSchemas.PlaylistControllerFindAll200Response.shape.playlists.element

export const playlistListItemSchema = playlistEntitySchema
  .pick({
    artwork: true,
    createdAt: true,
    id: true,
    title: true,
  })
  .extend({
    sectionsCount: z.number().int().nonnegative(),
    sermonsCount: z.number().int().nonnegative(),
  })

export type AdminPlaylistsListItem = z.infer<typeof playlistListItemSchema>

export const toPlaylistListItem = (playlist: APITypes.PlaylistEntity): AdminPlaylistsListItem => ({
  artwork: playlist.artwork,
  createdAt: playlist.createdAt,
  id: playlist.id,
  sectionsCount: playlist.sections.length,
  sermonsCount: playlist.sermons.length,
  title: playlist.title,
})
