import { isIndexedDbAvailable } from '../indexed-db/indexedDbRequest'
import { createMirroredStorage } from './createMirroredStorage'
import { openIndexedDbBackend } from './indexedDbBackend'
import { localStorageBackend } from './localStorageBackend'

// Web replacement for `@react-native-async-storage/async-storage`: Metro
// resolves the package to this file on web only (see metro.config.js), so
// every `AsyncStorage` import keeps working unchanged. Data lives in IndexedDB
// (async — never blocks the UI thread, no ~5 MB localStorage cap); the stock
// localStorage layout is the fallback when IndexedDB cannot be opened.
const openBackend = async () =>
  isIndexedDbAvailable() ? openIndexedDbBackend() : localStorageBackend

const AsyncStorage = createMirroredStorage(openBackend, localStorageBackend)

// Default export mirrors the replaced package's API (`import AsyncStorage from …`).
export default AsyncStorage
