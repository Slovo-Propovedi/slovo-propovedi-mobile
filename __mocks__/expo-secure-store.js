// In-memory stand-in for expo-secure-store. The native implementation resolves
// under jest-expo (defaultPlatform: 'ios'), so tests need a working backing map.
jest.mock('expo-secure-store', () => {
  const storage = {}

  // One long-lived jest.fn per method, paired with its in-memory implementation.
  // Identity must stay stable: test files capture methods at module scope
  // (`jest.mocked(SecureStore.getItemAsync)`), so swapping a property for a fresh
  // jest.fn would orphan those captures and hide the calls from their assertions.
  const createSecureStoreMocks = () => {
    const methods = {}
    const registry = []

    const register = (name, defaultImpl) => {
      const fn = jest.fn(defaultImpl)
      methods[name] = fn
      registry.push({ name, fn, defaultImpl })
    }

    register('deleteItemAsync', async key => {
      delete storage[key]
    })
    register('getItemAsync', async key => storage[key] ?? null)
    register('setItemAsync', async (key, value) => {
      storage[key] = value
    })

    return { methods, registry }
  }

  const { methods, registry } = createSecureStoreMocks()

  const secureStoreMock = {
    __esModule: true,
    ...methods,
    // Restores the in-memory implementations after jest.resetAllMocks()/
    // restoreAllMocks() wiped them. The canonical jest.fn instances are reused
    // (module-scope jest.mocked captures stay valid) and the backing map is kept:
    // the session-cache wipe clears it through these re-armed methods.
    rearmSecureStoreMock: () => {
      for (const { name, fn, defaultImpl } of registry) {
        fn.mockReset()
        // Jest's mockReset() also drops the implementation, so re-install it.
        fn.mockImplementation(defaultImpl)
        // A leftover jest.spyOn wrapper can hold the property; point it back at
        // the canonical fn. A property already holding it keeps its identity.
        if (secureStoreMock[name] !== fn) secureStoreMock[name] = fn
      }
    },
  }

  return secureStoreMock
})
