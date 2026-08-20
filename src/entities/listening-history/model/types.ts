import z from 'zod'
import { audioPlayerDataSchema } from 'entities/player'
import { playlistDataSchema } from 'shared/model'

export const listeningHistoryEntrySchema = z.object({
  durationMs: z.number().nonnegative(),
  lastPlayedAt: z.number(),
  playlist: playlistDataSchema,
  positionMs: z.number().nonnegative(),
  sermon: audioPlayerDataSchema.optional(),
})

export const listeningHistorySchema = z.array(listeningHistoryEntrySchema)

export type ListeningHistory = z.infer<typeof listeningHistorySchema>
export type ListeningHistoryEntry = z.infer<typeof listeningHistoryEntrySchema>
