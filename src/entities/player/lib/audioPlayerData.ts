import z from 'zod'
import { sermonDataSchema } from 'shared/model'

export const audioPlayerDataSchema = sermonDataSchema.extend({
  audioUrl: z.string(),
})

export type AudioPlayerData = z.infer<typeof audioPlayerDataSchema>
