import { type WebDirectoryHandle } from './webFsTypes'

// Хэндл выбранной папки переживает перезагрузку страницы только в IndexedDB —
// сам FileSystemDirectoryHandle не сериализуется в AsyncStorage.
const DB_NAME = 'slovo-backup'
const DB_VERSION = 1
const STORE_NAME = 'handles'
const FOLDER_HANDLE_KEY = 'backup-folder'

const isDirectoryHandle = (value: unknown): value is WebDirectoryHandle =>
  typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'directory'

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

export const saveDirectoryHandle = async (handle: WebDirectoryHandle): Promise<void> => {
  const db = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(handle, FOLDER_HANDLE_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } finally {
    db.close()
  }
}

export const loadDirectoryHandle = async (): Promise<null | WebDirectoryHandle> => {
  const db = await openDatabase()

  try {
    return await new Promise<null | WebDirectoryHandle>((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(FOLDER_HANDLE_KEY)

      request.onsuccess = () => {
        const value: unknown = request.result
        resolve(isDirectoryHandle(value) ? value : null)
      }
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}
