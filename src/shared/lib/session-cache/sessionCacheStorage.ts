import { clearPublicRecords, readPublicRecord, writePublicRecord } from './publicSessionStore'

// Generic fallback (tooling, non-web/non-native runtimes): everything goes to
// plain storage. Native resolves `.native.ts` (SecureStore for sensitive
// records), web resolves `.web.ts` (encrypted IndexedDB for sensitive records).
export const readSessionCacheRecord = (name: string, _sensitive: boolean) => readPublicRecord(name)

export const writeSessionCacheRecord = (name: string, json: string, _sensitive: boolean) =>
  writePublicRecord(name, json)

export const clearSessionCacheRecords = clearPublicRecords
