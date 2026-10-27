import { createEncryptedStore } from '../encrypted-store/createEncryptedStore'
import { clearPublicRecords, readPublicRecord, writePublicRecord } from './publicSessionStore'

// Web: public records go to plain storage; `sensitive` ones (personal data)
// are AES-GCM ciphertext in a dedicated IndexedDB database. Both are wiped
// together on sign-out.
const encryptedStore = createEncryptedStore('slovo_session_cache')

export const readSessionCacheRecord = (name: string, sensitive: boolean) =>
  sensitive ? encryptedStore.read(name) : readPublicRecord(name)

export const writeSessionCacheRecord = (name: string, json: string, sensitive: boolean) =>
  sensitive ? encryptedStore.write(name, json) : writePublicRecord(name, json)

export const clearSessionCacheRecords = async (): Promise<void> => {
  await Promise.all([encryptedStore.clear(), clearPublicRecords()])
}
