import z from 'zod'
import { createSessionCache } from 'shared/lib/session-cache'

const countSchema = z.number().nullable()

/** Last known entity counters of the admin home screen. */
export const adminStatsCache = createSessionCache<{
  playlists: null | number
  sections: null | number
  sermons: null | number
}>({
  maxEntries: 1,
  name: 'adminStats',
  schema: z.object({ playlists: countSchema, sections: countSchema, sermons: countSchema }),
})
