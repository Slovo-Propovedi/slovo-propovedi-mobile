import { APP_VERSION } from '../config/version'
import { isOtaUpdateAvailable, readRunningAppVersion } from './updateOtaStatus'

const mockLoadExpoUpdates = jest.fn()

// The real loader does `await import('expo-updates')`, which Jest's CommonJS VM
// cannot intercept (no --experimental-vm-modules). Mock the loader seam instead
// and drive its resolved/rejected outcome per test.
jest.mock('./loadExpoUpdates', () => ({
  loadExpoUpdates: (...args: unknown[]) => mockLoadExpoUpdates(...args),
}))

const MANIFEST = { extra: { expoClient: { version: '0.30.0' } } }

describe('readRunningAppVersion', () => {
  beforeEach(() => {
    mockLoadExpoUpdates.mockReset()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  test('falls back to APP_VERSION when expo-updates cannot be imported', async () => {
    mockLoadExpoUpdates.mockRejectedValueOnce(new Error('expo-updates is not available'))

    const version = await readRunningAppVersion()

    expect(version).toBe(APP_VERSION)
    expect(console.warn).toHaveBeenCalled()
  })

  test('returns the baked version on an embedded launch', async () => {
    mockLoadExpoUpdates.mockResolvedValueOnce({ isEmbeddedLaunch: true, manifest: MANIFEST })

    expect(await readRunningAppVersion()).toBe(APP_VERSION)
  })

  test('returns the running manifest version on an OTA launch', async () => {
    mockLoadExpoUpdates.mockResolvedValueOnce({ isEmbeddedLaunch: false, manifest: MANIFEST })

    expect(await readRunningAppVersion()).toBe('0.30.0')
  })
})

describe('isOtaUpdateAvailable', () => {
  beforeEach(() => {
    mockLoadExpoUpdates.mockReset()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  test('returns false when checkForUpdateAsync throws', async () => {
    mockLoadExpoUpdates.mockResolvedValueOnce({
      checkForUpdateAsync: jest.fn().mockRejectedValue(new Error('network down')),
    })

    expect(await isOtaUpdateAvailable()).toBe(false)
    expect(console.warn).toHaveBeenCalled()
  })

  test('returns true when a bundle is available for this runtime', async () => {
    mockLoadExpoUpdates.mockResolvedValueOnce({
      checkForUpdateAsync: jest.fn().mockResolvedValue({ isAvailable: true }),
    })

    expect(await isOtaUpdateAvailable()).toBe(true)
  })
})
