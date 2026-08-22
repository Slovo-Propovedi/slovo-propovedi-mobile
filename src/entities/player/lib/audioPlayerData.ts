import z from 'zod'
import { type SermonData, sermonDataSchema } from 'shared/model'

export const audioPlayerDataSchema = sermonDataSchema.extend({
  audioUrl: z.string(),
})

export type AudioPlayerData = z.infer<typeof audioPlayerDataSchema>

export const toAudioPlayerData = (sermon: SermonData | undefined): AudioPlayerData | null =>
  sermon?.audioUrl ? { ...sermon, audioUrl: sermon.audioUrl } : null
