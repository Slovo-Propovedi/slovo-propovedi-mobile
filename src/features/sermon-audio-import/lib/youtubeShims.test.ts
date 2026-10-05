import { installCryptoShims, installYoutubeShims } from './youtubeShims'

const mockGetRandomValues = jest.fn((array: Uint8Array) => array)
const mockRandomUUID = jest.fn(() => 'mock-uuid')

jest.mock('expo-crypto', () => ({
  getRandomValues: (array: Uint8Array) => mockGetRandomValues(array),
  randomUUID: () => mockRandomUUID(),
}))

// installYoutubeShims динамически импортирует платформу youtubei.js, а в Jest
// нативный import() без --experimental-vm-modules не исполняется. Поэтому
// покрываем чистую крипто-часть; полный шим проверяется вручную на устройстве.
const originalCrypto = globalThis.crypto

describe('youtubeShims', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: originalCrypto })
    jest.clearAllMocks()
  })

  test('exposes installYoutubeShims without loading the library', () => {
    expect(installYoutubeShims).toBeInstanceOf(Function)
  })

  test('installs getRandomValues and randomUUID on a host without them', () => {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: {} })

    installCryptoShims()

    const values = new Uint8Array(4)
    expect(globalThis.crypto.getRandomValues(values)).toStrictEqual(values)
    expect(globalThis.crypto.randomUUID()).toBe('mock-uuid')
    expect(mockGetRandomValues).toHaveBeenCalledWith(values)
    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  })

  test('keeps crypto functions the host already provides', () => {
    const existingGetRandomValues = jest.fn()
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { getRandomValues: existingGetRandomValues },
    })

    installCryptoShims()

    expect(globalThis.crypto.getRandomValues).toBe(existingGetRandomValues)
    expect(mockGetRandomValues).not.toHaveBeenCalled()
  })
})
