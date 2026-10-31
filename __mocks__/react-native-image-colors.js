// react-native-image-colors calls requireNativeModule('ImageColors') at module load,
// which throws under jest (no native module). `getColors` stays a jest.fn() so tests
// can stub the platform-specific result shape.
jest.mock('react-native-image-colors', () => {
  const cache = {
    clear: jest.fn(() => true),
    getItem: jest.fn(() => undefined),
    removeItem: jest.fn(() => true),
    setItem: jest.fn(),
  }

  const getColors = jest.fn()

  return {
    __esModule: true,
    cache,
    default: { cache, getColors },
    getColors,
  }
})
