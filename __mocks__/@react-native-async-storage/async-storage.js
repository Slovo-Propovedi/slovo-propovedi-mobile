const storage: Record<string, string | null> = {}

// Every method is ONE long-lived jest.fn created at module load, together with
// the in-memory implementation it falls back to. The identity must stay stable:
// test files capture methods at module scope (`jest.mocked(AsyncStorage.setItem)`),
// so replacing a property with a fresh jest.fn would orphan those captures — the
// production code would call the new mock while the captured one records nothing.
const createAsyncStorageMocks = () => {
  const methods = {}
  const registry = []

  const register = (name, defaultImpl) => {
    const fn = jest.fn(defaultImpl)
    methods[name] = fn
    registry.push({ name, fn, defaultImpl })
  }

  register('getItem', async (key: string) => storage[key] ?? null)
  register('multiGet', async (keys: string[]) => keys.map(key => [key, storage[key] ?? null]))
  register('setItem', async (key: string, value: string) => {
    storage[key] = value
  })
  register('removeItem', async (key: string) => {
    delete storage[key]
  })
  register('getMany', async (keys: string[]) => {
    const result: Record<string, string | null> = {}
    for (const key of keys) {
      result[key] = storage[key] ?? null
    }
    return result
  })
  register('setMany', async (entries: Record<string, string>) => {
    Object.assign(storage, entries)
  })
  register('removeMany', async (keys: string[]) => {
    for (const key of keys) {
      delete storage[key]
    }
  })
  register('multiRemove', async (keys: string[]) => {
    for (const key of keys) {
      delete storage[key]
    }
  })
  register('getAllKeys', async () => Object.keys(storage))
  register('clear', async () => {
    Object.keys(storage).forEach(key => delete storage[key])
  })

  return { methods, registry }
}

const { methods: asyncStorageMock, registry: storageMethodRegistry } = createAsyncStorageMocks()

// Restores the in-memory implementations after jest.resetAllMocks()/
// restoreAllMocks() wiped them. The canonical jest.fn instances are reused, so
// module-scope jest.mocked captures keep observing the calls; only the
// implementation and the call history are reset. The storage map itself is kept:
// the session-cache wipe clears it through these re-armed methods.
export const rearmAsyncStorageMock = () => {
  for (const { name, fn, defaultImpl } of storageMethodRegistry) {
    fn.mockReset()
    // Jest's mockReset() also drops the implementation, so re-install the default.
    fn.mockImplementation(defaultImpl)
    // A leftover jest.spyOn wrapper can hold the property; point it back at the
    // canonical fn. A property already holding it keeps its identity untouched.
    if (asyncStorageMock[name] !== fn) asyncStorageMock[name] = fn
  }
}

export default asyncStorageMock
