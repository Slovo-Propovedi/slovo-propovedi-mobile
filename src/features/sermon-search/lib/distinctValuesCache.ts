import z from 'zod'
import { CACHED_DISTINCT_VALUES } from 'shared/config'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'

// Keep in sync with the generated SermonControllerGetDistinctValues200Response
// (src/shared/api/generated/model/sermons.ts) when the API is regenerated.
export const distinctValuesSchema = z.object({
  artists: z.array(z.string()),
  books: z.array(z.string()),
})

export type DistinctValues = z.infer<typeof distinctValuesSchema>

export const getCachedDistinctValues = async (): Promise<DistinctValues | undefined> =>
  getCachedJson(CACHED_DISTINCT_VALUES, distinctValuesSchema)

export const setCachedDistinctValues = async (values: DistinctValues): Promise<void> => {
  await setCachedJson(CACHED_DISTINCT_VALUES, values)
}
