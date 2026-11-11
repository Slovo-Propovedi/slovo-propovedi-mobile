const storage: Record<string, string | null> = {}

const createAsyncStorageMocks = () => ({
  getItem: jest.fn(async (key: string) => storage[key] ?? null),
  multiGet: jest.fn(async (keys: string[]) => keys.map(key => [key, storage[key] ?? null])),
  setItem: jest.fn(async (key: string, value: string) => {
    storage[key] = value
  }),
  removeItem: jest.fn(async (key: string) => {
    delete storage[key]
  }),
  getMany: jest.fn(async (keys: string[]) => {
    const result: Record<string, string | null> = {}
    for (const key of keys) {
      result[key] = storage[key] ?? null
    }
    return result
  }),
  setMany: jest.fn(async (entries: Record<string, string>) => {
    Object.assign(storage, entries)
  }),
  removeMany: jest.fn(async (keys: string[]) => {
    for (const key of keys) {
      delete storage[key]
    }
  }),
  multiRemove: jest.fn(async (keys: string[]) => {
    for (const key of keys) {
      delete storage[key]
    }
  }),
  getAllKeys: jest.fn(async () => Object.keys(storage)),
  clear: jest.fn(async () => {
    Object.keys(storage).forEach(key => delete storage[key])
  }),
})

const asyncStorageMock = createAsyncStorageMocks()

// Restores the in-memory implementations after jest.resetAllMocks()/
// restoreAllMocks() wiped them, or after a jest.spyOn wrapper was left behind
// (the property is reassigned to a fresh jest.fn). The storage map itself is
// kept: the session-cache wipe clears it through these re-armed methods.
export const rearmAsyncStorageMock = () => {
  Object.assign(asyncStorageMock, createAsyncStorageMocks())
}

export default asyncStorageMock
