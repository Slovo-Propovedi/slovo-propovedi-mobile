const storage: Record<string, string | null> = {}

export default {
  getItem: jest.fn(async (key: string) => storage[key] ?? null),
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
  getAllKeys: jest.fn(async () => Object.keys(storage)),
  clear: jest.fn(async () => {
    Object.keys(storage).forEach(key => delete storage[key])
  }),
}