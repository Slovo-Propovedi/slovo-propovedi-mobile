import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { getParseJsonWithSchema } from '../../model/getParseJsonWithSchema'
import { getCachedJson } from './getCachedJson'
import { setCachedJson } from './setCachedJson'

const queryIndexSchema = z.array(z.string())

const normalizeQuery = (query: string): string => query.trim().toLowerCase()

/**
 * Storage key for one query's cached entries. Data keys use a separate `:q:`
 * namespace so a query literally named "index" cannot collide with the index key.
 * @param prefix - Cache prefix (e.g. `cachedSermonSearch`).
 * @param query - Raw query; trimmed and lowercased.
 */
export const getQueryCacheKey = (prefix: string, query: string): string =>
  `${prefix}:q:${normalizeQuery(query)}`

/**
 * Creates a per-query cache: bounded recent-query index, serialized writes and
 * self-healing cleanup when the index is corrupt. Generic over the entry type.
 * @param config - Cache configuration.
 * @param config.indexKey - Storage key holding the recent-query index.
 * @param config.label - Area name used in warning/error logs.
 * @param config.maxEntries - Maximum number of query keys kept in the index.
 * @param config.prefix - Storage prefix; data keys are `${prefix}:q:<query>`.
 * @param config.schema - Trusted schema validating entries at the read boundary.
 */
export const createQueryCache = <T>({
  indexKey,
  label,
  maxEntries,
  prefix,
  schema,
}: {
  indexKey: string
  label: string
  maxEntries: number
  prefix: string
  schema: z.ZodType<T[]>
}) => {
  const parseIndex = getParseJsonWithSchema(queryIndexSchema)

  let writeQueue: Promise<void> = Promise.resolve()

  // Removes every key under the cache namespace except the index and the freshly
  // written key. Also clears legacy `<prefix>:<query>` keys from before the `:q:`
  // scheme, so the migration leaves no stale entries behind.
  const cleanOrphanedKeys = async (excludeKey?: string): Promise<void> => {
    const allKeys = await AsyncStorage.getAllKeys()
    const orphanedKeys = allKeys.filter(
      key => key.startsWith(`${prefix}:`) && key !== indexKey && key !== excludeKey,
    )
    if (orphanedKeys.length === 0) return
    await AsyncStorage.multiRemove(orphanedKeys)
  }

  const updateIndex = async (latestKey: string): Promise<void> => {
    const rawIndex = await AsyncStorage.getItem(indexKey)
    const parsedIndex = parseIndex(rawIndex)

    if (rawIndex !== null && parsedIndex === undefined) {
      let cleanupSucceeded = true
      await cleanOrphanedKeys(latestKey).catch(error => {
        console.warn(`Failed to clean orphaned ${label} cache keys:`, error)
        cleanupSucceeded = false
      })
      if (cleanupSucceeded) await setCachedJson(indexKey, [latestKey])
      return
    }

    const index = parsedIndex ?? []
    const withoutLatest = index.filter(entry => entry !== latestKey)
    const nextIndex = [...withoutLatest, latestKey]

    if (nextIndex.length > maxEntries) {
      const overflowCount = nextIndex.length - maxEntries
      await AsyncStorage.multiRemove(nextIndex.slice(0, overflowCount))
    }

    await setCachedJson(indexKey, nextIndex.slice(-maxEntries))
  }

  const writeEntry = async (key: string, values: T[]): Promise<void> => {
    await setCachedJson(key, values)
    await updateIndex(key)
  }

  const enqueueWrite = (key: string, values: T[]): Promise<void> => {
    writeQueue = writeQueue
      .then(() => writeEntry(key, values))
      .catch(error => {
        console.error(`${label} cache write failed:`, error)
      })

    return writeQueue
  }

  return {
    get: (query: string): Promise<T[] | undefined> =>
      getCachedJson(getQueryCacheKey(prefix, query), schema),
    // Empty arrays are skipped; the promise never rejects (failures are logged
    // inside the write queue).
    set: async (query: string, values: T[]): Promise<void> => {
      if (values.length === 0) return

      await enqueueWrite(getQueryCacheKey(prefix, query), values)
    },
  }
}
