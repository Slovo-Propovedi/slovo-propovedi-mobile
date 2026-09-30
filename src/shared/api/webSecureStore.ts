/**
 * Web-only encrypted key/value store for sensitive values (auth tokens).
 *
 * Values are encrypted with AES-GCM using a NON-extractable CryptoKey that is
 * itself persisted in IndexedDB (structured clone supports CryptoKey). Only
 * ciphertext ever reaches disk; the key material cannot be exported. When
 * WebCrypto or IndexedDB is unavailable the store degrades to memory only —
 * it never writes plaintext to localStorage.
 */

import {
  decryptValue,
  encryptValue,
  generateEncryptionKey,
  isCryptoKey,
  isEncryptedEntry,
  isWebCryptoAvailable,
} from './webEncryption'

const DATABASE_NAME = 'slovo_secure_storage'
const DATABASE_VERSION = 1
const ENTRIES_STORE = 'entries'
const KEY_STORE = 'keys'
const CRYPTO_KEY_ID = 'aes-gcm-key'

const memoryFallback = new Map<string, string>()

const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined'

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'))
    }
  })

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      request.result.createObjectStore(ENTRIES_STORE)
      request.result.createObjectStore(KEY_STORE)
    }
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open secure storage database'))
    }
  })

const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
  const database = await openDatabase()

  try {
    return await operation(database.transaction(storeName, mode).objectStore(storeName))
  } finally {
    database.close()
  }
}

const readFromStore = (storeName: string, key: string) =>
  withStore(storeName, 'readonly', store => requestResult<unknown>(store.get(key)))

const getOrCreateCryptoKey = async (): Promise<CryptoKey> => {
  const stored = await readFromStore(KEY_STORE, CRYPTO_KEY_ID)
  if (isCryptoKey(stored)) return stored

  const key = await generateEncryptionKey()
  await withStore(KEY_STORE, 'readwrite', store => requestResult(store.put(key, CRYPTO_KEY_ID)))

  return key
}

export const readEncryptedValue = async (key: string): Promise<null | string> => {
  if (!isWebCryptoAvailable() || !isIndexedDbAvailable()) return memoryFallback.get(key) ?? null

  try {
    const entry = await readFromStore(ENTRIES_STORE, key)
    if (!isEncryptedEntry(entry)) return null

    return await decryptValue(entry, await getOrCreateCryptoKey())
  } catch {
    return null
  }
}

export const writeEncryptedValue = async (key: string, value: string): Promise<void> => {
  if (!isWebCryptoAvailable() || !isIndexedDbAvailable()) {
    memoryFallback.set(key, value)

    return
  }

  try {
    const entry = await encryptValue(value, await getOrCreateCryptoKey())
    await withStore(ENTRIES_STORE, 'readwrite', store => requestResult(store.put(entry, key)))
  } catch {
    memoryFallback.set(key, value)
  }
}

export const removeEncryptedValue = async (key: string): Promise<void> => {
  memoryFallback.delete(key)
  if (!isIndexedDbAvailable()) return

  try {
    await withStore(ENTRIES_STORE, 'readwrite', store => requestResult(store.delete(key)))
  } catch {
    // Missing database means nothing to delete.
  }
}
