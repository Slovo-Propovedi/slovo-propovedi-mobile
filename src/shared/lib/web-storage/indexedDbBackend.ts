import { openDatabase, requestResult } from '../indexed-db/indexedDbRequest'
import { type StorageBackend } from './createMirroredStorage'
import { isLocalStorageAvailable, readLocalStorageEntries } from './localStorageBackend'

const DATABASE_NAME = 'slovo_storage'
const STORE = 'kv'

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'))
  })

const loadEntries = async (database: IDBDatabase): Promise<Map<string, string>> => {
  const store = database.transaction(STORE, 'readonly').objectStore(STORE)
  const [keys, values] = await Promise.all([
    requestResult(store.getAllKeys()),
    requestResult<unknown[]>(store.getAll()),
  ])

  const entries = new Map<string, string>()
  keys.forEach((key, index) => {
    const value = values[index]
    if (typeof key === 'string' && typeof value === 'string') entries.set(key, value)
  })
  return entries
}

const writeEntries = (database: IDBDatabase, entries: [string, string][]) => {
  const transaction = database.transaction(STORE, 'readwrite')
  const store = transaction.objectStore(STORE)
  entries.forEach(([key, value]) => store.put(value, key))
  return transactionDone(transaction)
}

/**
 * One-time migration from the stock web AsyncStorage (localStorage): entries
 * missing in IndexedDB are copied over, then removed from localStorage so no
 * stale copy stays behind. Idempotent — after it localStorage is empty.
 * @param database - Open storage database.
 * @param entries - Entries already in IndexedDB (updated in place).
 */
const migrateLocalStorage = async (database: IDBDatabase, entries: Map<string, string>) => {
  if (!isLocalStorageAvailable() || localStorage.length === 0) return

  const legacy = [...readLocalStorageEntries()].filter(([key]) => !entries.has(key))
  if (legacy.length > 0) await writeEntries(database, legacy)
  legacy.forEach(([key, value]) => entries.set(key, value))
  localStorage.clear()
}

/**
 * IndexedDB backend of the web AsyncStorage. Keeps one connection open for the
 * page lifetime (no per-call open cost).
 */
export const openIndexedDbBackend = async (): Promise<StorageBackend> => {
  const database = await openDatabase(DATABASE_NAME, [STORE])

  return {
    clear: async () => {
      const transaction = database.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).clear()
      await transactionDone(transaction)
    },
    loadAll: async () => {
      const entries = await loadEntries(database)
      await migrateLocalStorage(database, entries)
      return entries
    },
    put: entries => writeEntries(database, entries),
    remove: async keys => {
      const transaction = database.transaction(STORE, 'readwrite')
      const store = transaction.objectStore(STORE)
      keys.forEach(key => store.delete(key))
      await transactionDone(transaction)
    },
  }
}
