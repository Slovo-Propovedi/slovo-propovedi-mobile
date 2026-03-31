import z from 'zod'

export const bookDataSchema = z.object({
  artwork: z.string(),
  description: z.string().optional(),
  id: z.string(),
  textFileUrl: z.string().optional(),
  title: z.string(),
})

export type BookData = z.infer<typeof bookDataSchema>

export const sermonDataSchema = z.object({
  artist: z.string(),
  artwork: z.string(),
  audioUrl: z.string().optional(),
  description: z.string().optional(),
  id: z.string(),
  textFileUrl: z.string().optional(),
  title: z.string(),
  youtubeUrl: z.string().optional(),
})

export type SermonData = z.infer<typeof sermonDataSchema>

export const playlistDataSchema = z.object({
  artwork: z.string(),
  description: z.string().optional(),
  list: sermonDataSchema.array(),
  title: z.string(),
})

export type PlaylistData = z.infer<typeof playlistDataSchema>
