import { type AsyncStorageStatic } from '@react-native-async-storage/async-storage'

/** Persistent key/value backend behind the in-memory mirror. */
export interface StorageBackend {
  clear: () => Promise<void>
  /** Every stored entry; called once, on first access. */
  loadAll: () => Promise<Map<string, string>>
  put: (entries: [string, string][]) => Promise<void>
  remove: (keys: string[]) => Promise<void>
}

const unsupported = () =>
  Promise.reject(new Error('mergeItem/multiMerge are not supported by the web storage'))

/**
 * AsyncStorage-compatible storage over a persistent backend with an in-memory
 * mirror: the backend is read once (single transaction) on first access, then
 * reads are served from memory. Writes update the mirror at once and resolve
 * after the backend has persisted them. `mergeItem`/`multiMerge` are not
 * implemented — the app never uses them.
 * @param openBackend - Lazily opens the primary backend.
 * @param fallback - Used when the primary backend fails to open or load.
 */
export const createMirroredStorage = (
  openBackend: () => Promise<StorageBackend>,
  fallback?: StorageBackend,
): AsyncStorageStatic => {
  let ready: null | Promise<{ backend: StorageBackend; mirror: Map<string, string> }> = null

  const load = async (backend: StorageBackend) => ({ backend, mirror: await backend.loadAll() })

  const open = () => {
    ready ??= openBackend()
      .then(load)
      .catch(error => {
        if (!fallback) throw error
        console.error('[web-storage] primary storage failed, using fallback:', error)
        return load(fallback)
      })
    return ready
  }

  const setMany = async (entries: [string, string][]) => {
    const { backend, mirror } = await open()
    entries.forEach(([key, value]) => mirror.set(key, value))
    await backend.put(entries)
  }

  const removeMany = async (keys: string[]) => {
    const { backend, mirror } = await open()
    keys.forEach(key => mirror.delete(key))
    await backend.remove(keys)
  }

  return {
    clear: async () => {
      const { backend, mirror } = await open()
      mirror.clear()
      await backend.clear()
    },
    flushGetRequests: () => undefined,
    getAllKeys: async () => [...(await open()).mirror.keys()],
    getItem: async key => (await open()).mirror.get(key) ?? null,
    mergeItem: unsupported,
    multiGet: async keys => {
      const { mirror } = await open()
      return keys.map(key => [key, mirror.get(key) ?? null])
    },
    multiMerge: unsupported,
    multiRemove: keys => removeMany([...keys]),
    multiSet: entries => setMany(entries.map(([key, value]) => [key, value])),
    removeItem: key => removeMany([key]),
    setItem: (key, value) => setMany([[key, value]]),
  }
}
