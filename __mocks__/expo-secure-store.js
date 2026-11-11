// In-memory stand-in for expo-secure-store. The native implementation resolves
// under jest-expo (defaultPlatform: 'ios'), so tests need a working backing map.
jest.mock('expo-secure-store', () => {
  const storage = {}

  const createSecureStoreMocks = () => ({
    deleteItemAsync: jest.fn(async key => {
      delete storage[key]
    }),
    getItemAsync: jest.fn(async key => storage[key] ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      storage[key] = value
    }),
  })

  const secureStoreMock = {
    __esModule: true,
    ...createSecureStoreMocks(),
    // Restores the in-memory implementations after jest.resetAllMocks()/
    // restoreAllMocks() wiped them. The backing map is kept: the session-cache
    // wipe clears it through these re-armed methods.
    rearmSecureStoreMock: () => {
      Object.assign(secureStoreMock, createSecureStoreMocks())
    },
  }

  return secureStoreMock
})
