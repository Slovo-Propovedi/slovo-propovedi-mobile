// In-memory stand-in for expo-secure-store. The native implementation resolves
// under jest-expo (defaultPlatform: 'ios'), so tests need a working backing map.
jest.mock('expo-secure-store', () => {
  const storage = {}

  return {
    __esModule: true,
    deleteItemAsync: jest.fn(async key => {
      delete storage[key]
    }),
    getItemAsync: jest.fn(async key => storage[key] ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      storage[key] = value
    }),
  }
})
