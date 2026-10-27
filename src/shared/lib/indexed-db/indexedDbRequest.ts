// Minimal promise helpers over the raw IndexedDB API (no dependency needed).

const DATABASE_VERSION = 1

export const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined'

export const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'))
    }
  })

/**
 * Opens (and on first use creates) a database with the given object stores.
 * @param databaseName - Database name (persisted).
 * @param storeNames - Object stores created on the first open.
 */
export const openDatabase = (databaseName: string, storeNames: string[]): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      storeNames.forEach(storeName => request.result.createObjectStore(storeName))
    }
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to open ${databaseName} database`))
    }
  })
