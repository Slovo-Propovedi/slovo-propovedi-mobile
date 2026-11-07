import { type StorageBackend } from './createMirroredStorage'

export const isLocalStorageAvailable = (): boolean => {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    // Accessing `localStorage` throws when site data is blocked.
    return false
  }
}

/** Every localStorage entry (what the stock web AsyncStorage wrote). */
export const readLocalStorageEntries = (): Map<string, string> => {
  const entries = new Map<string, string>()
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    const value = key === null ? null : localStorage.getItem(key)
    if (key !== null && value !== null) entries.set(key, value)
  }
  return entries
}

/** Fallback backend when IndexedDB is unavailable: the stock localStorage layout. */
export const localStorageBackend: StorageBackend = {
  clear: async () => localStorage.clear(),
  loadAll: async () => readLocalStorageEntries(),
  put: async entries => entries.forEach(([key, value]) => localStorage.setItem(key, value)),
  remove: async keys => keys.forEach(key => localStorage.removeItem(key)),
}
