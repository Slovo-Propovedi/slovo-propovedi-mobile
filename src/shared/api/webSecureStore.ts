/**
 * Web-only encrypted store for sensitive values (auth tokens): AES-GCM with a
 * non-extractable key in IndexedDB (see `createEncryptedStore`). The database
 * name is persisted state — renaming it would sign every web user out.
 */

import { createEncryptedStore } from '../lib/encrypted-store/createEncryptedStore'

const secureStore = createEncryptedStore('slovo_secure_storage')

export const readEncryptedValue = secureStore.read

export const writeEncryptedValue = secureStore.write

export const removeEncryptedValue = secureStore.remove
