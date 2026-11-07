/**
 * Web encrypted key/value store over IndexedDB.
 *
 * Values are encrypted with AES-GCM using a NON-extractable CryptoKey that is
 * itself persisted in the same database (structured clone supports CryptoKey).
 * Only ciphertext ever reaches disk; the key material cannot be exported. When
 * WebCrypto or IndexedDB is unavailable the store degrades to memory only —
 * it never writes plaintext to localStorage.
 *
 * Each `databaseName` is an independent store with its own key, so one store
 * can be wiped (`clear`) without touching another.
 */

import { isIndexedDbAvailable, openDatabase, requestResult } from '../indexed-db/indexedDbRequest'
import {
  decryptValue,
  encryptValue,
  generateEncryptionKey,
  isCryptoKey,
  isEncryptedEntry,
  isWebCryptoAvailable,
} from './webEncryption'

const ENTRIES_STORE = 'entries'
const KEY_STORE = 'keys'
const CRYPTO_KEY_ID = 'aes-gcm-key'

const isStoreAvailable = () => isWebCryptoAvailable() && isIndexedDbAvailable()

/**
 * Creates an encrypted store bound to one IndexedDB database.
 * @param databaseName - IndexedDB database name (stable: renaming loses data).
 */
export const createEncryptedStore = (databaseName: string) => {
  const memoryFallback = new Map<string, string>()

  const withStore = async <T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T> => {
    const database = await openDatabase(databaseName, [ENTRIES_STORE, KEY_STORE])

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

  const read = async (key: string): Promise<null | string> => {
    if (!isStoreAvailable()) return memoryFallback.get(key) ?? null

    try {
      const entry = await readFromStore(ENTRIES_STORE, key)
      if (!isEncryptedEntry(entry)) return null

      return await decryptValue(entry, await getOrCreateCryptoKey())
    } catch {
      return null
    }
  }

  const write = async (key: string, value: string): Promise<void> => {
    if (!isStoreAvailable()) {
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

  const remove = async (key: string): Promise<void> => {
    memoryFallback.delete(key)
    if (!isIndexedDbAvailable()) return

    try {
      await withStore(ENTRIES_STORE, 'readwrite', store => requestResult(store.delete(key)))
    } catch {
      // Missing database means nothing to delete.
    }
  }

  // Wipes every entry but keeps the CryptoKey, so later writes reuse it.
  const clear = async (): Promise<void> => {
    memoryFallback.clear()
    if (!isIndexedDbAvailable()) return

    try {
      await withStore(ENTRIES_STORE, 'readwrite', store => requestResult(store.clear()))
    } catch {
      // Missing database means nothing to clear.
    }
  }

  return { clear, read, remove, write }
}
