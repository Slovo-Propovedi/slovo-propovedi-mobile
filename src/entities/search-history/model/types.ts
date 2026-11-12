import z from 'zod'
import { audioPlayerDataSchema } from 'entities/sermon/@x/search-history'

export const searchHistoryEntrySchema = z.object({
  savedAt: z.number(),
  sermon: audioPlayerDataSchema,
})

export const searchHistorySchema = z.array(searchHistoryEntrySchema)

export type SearchHistory = z.infer<typeof searchHistorySchema>
export type SearchHistoryEntry = z.infer<typeof searchHistoryEntrySchema>
