import z from 'zod'

export interface BookData {
  description?: string
  id: string
  previewUrl?: string
  textFileUrl?: string
  title: string
}

export const sermonDataSchema = z.object({
  audioUrl: z.string().optional(),
  description: z.string().optional(),
  id: z.string(),
  textFileUrl: z.string().optional(),
  title: z.string(),
  youtubeUrl: z.string().optional(),
})

export type SermonData = z.infer<typeof sermonDataSchema>

export const playlistDataSchema = z.object({
  description: z.string().optional(),
  list: sermonDataSchema.array(),
  previewUrl: z.string().optional(),
  title: z.string(),
})

export type PlaylistData = z.infer<typeof playlistDataSchema>
