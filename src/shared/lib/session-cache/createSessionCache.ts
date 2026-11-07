import z from 'zod'
import { getParseJsonWithSchema } from '../../model/getParseJsonWithSchema'
import { getSessionCacheEpoch } from './sessionCacheEpoch'
import { readSessionCacheRecord, writeSessionCacheRecord } from './sessionCacheStorage'

const recordSchema = z.object({
  entries: z.array(z.object({ key: z.string(), value: z.unknown() })),
})

type CacheRecord = z.infer<typeof recordSchema>

const parseRecord = getParseJsonWithSchema(recordSchema)

export interface SessionCache<T> {
  /**
   * Runs `fetcher` and stores its result under `key` (fire-and-forget).
   * The write is dropped if the cache was cleared while the request was in flight.
   */
  fetchThrough: (key: string, fetcher: () => Promise<T>) => Promise<T>
  /** Cached value for `key`, or `undefined` when missing or invalid. */
  read: (key: string) => Promise<T | undefined>
  /** Forgets `key` (used when the server answered 404 for it). */
  remove: (key: string) => Promise<void>
}

/**
 * Session-scoped cache for authenticated data (admin screens). One storage
 * record per `name` holds up to `maxEntries` most recently written keys (one
 * per entity id or filter combination). Values are validated with `schema`
 * at the read boundary. The whole cache is wiped by `clearSessionCache` on
 * sign-out; `sensitive` records are additionally encrypted on web.
 * @param config - Cache configuration.
 * @param config.maxEntries - How many keys to keep (oldest are dropped).
 * @param config.name - Unique record name (persisted: renaming drops the cache).
 * @param config.schema - Schema of one cached value.
 * @param config.sensitive - Personal data: encrypted at rest on web.
 */
export const createSessionCache = <T>({
  maxEntries,
  name,
  schema,
  sensitive = false,
}: {
  maxEntries: number
  name: string
  schema: z.ZodType<T>
  sensitive?: boolean
}): SessionCache<T> => {
  let writeQueue: Promise<void> = Promise.resolve()

  const readRecord = async (): Promise<CacheRecord> =>
    parseRecord(await readSessionCacheRecord(name, sensitive)) ?? { entries: [] }

  // Read-modify-write is serialized so concurrent writes never drop entries.
  const updateRecord = (update: (record: CacheRecord) => CacheRecord, epoch: number) => {
    writeQueue = writeQueue
      .then(async () => {
        if (epoch !== getSessionCacheEpoch()) return
        const next = update(await readRecord())
        if (epoch !== getSessionCacheEpoch()) return
        await writeSessionCacheRecord(name, JSON.stringify(next), sensitive)
      })
      .catch(error => console.error(`[session-cache] ${name} write failed:`, error))

    return writeQueue
  }

  const withoutKey = (record: CacheRecord, key: string) =>
    record.entries.filter(entry => entry.key !== key)

  const read = async (key: string): Promise<T | undefined> => {
    try {
      const entry = (await readRecord()).entries.find(item => item.key === key)
      if (!entry) return undefined

      const parsed = schema.safeParse(entry.value)
      return parsed.success ? parsed.data : undefined
    } catch (error) {
      console.error(`[session-cache] ${name} read failed:`, error)
      return undefined
    }
  }

  const fetchThrough = async (key: string, fetcher: () => Promise<T>): Promise<T> => {
    const epoch = getSessionCacheEpoch()
    const value = await fetcher()

    void updateRecord(
      record => ({ entries: [...withoutKey(record, key), { key, value }].slice(-maxEntries) }),
      epoch,
    )

    return value
  }

  const remove = (key: string): Promise<void> =>
    updateRecord(record => ({ entries: withoutKey(record, key) }), getSessionCacheEpoch())

  return { fetchThrough, read, remove }
}
