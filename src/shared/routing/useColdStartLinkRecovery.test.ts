import { act, renderHook } from '@testing-library/react-native'
import { Linking, Platform } from 'react-native'
import { useColdStartLinkRecovery } from './useColdStartLinkRecovery'

const PLAYLIST_PATH = '/listen/playlist?playlist=abc'
const PLAYLIST_URL = `https://app.slovo-propovedi.ru${PLAYLIST_PATH}`
const LISTEN_URL = 'https://app.slovo-propovedi.ru/listen'
const RECOVERY_DELAY_MS = 1000

const mockPush = jest.fn()
let mockPathname = '/listen'

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}))

const advanceToRecovery = async () => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(RECOVERY_DELAY_MS)
  })
}

describe('useColdStartLinkRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockPathname = '/listen'
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test('does not read the launch URL on iOS', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    const getInitialURL = jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(PLAYLIST_URL)
    try {
      await renderHook(() => useColdStartLinkRecovery())

      await advanceToRecovery()

      expect(getInitialURL).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('does not recover when the launch path matches the current route', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(LISTEN_URL)
    try {
      await renderHook(() => useColdStartLinkRecovery())

      await advanceToRecovery()

      expect(mockPush).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('does not recover when there is no launch URL', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null)
    try {
      await renderHook(() => useColdStartLinkRecovery())

      await advanceToRecovery()

      expect(mockPush).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('logs an error and does not push when reading the initial URL rejects', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(Linking, 'getInitialURL').mockRejectedValue(new Error('read failed'))
    try {
      await renderHook(() => useColdStartLinkRecovery())

      await advanceToRecovery()

      expect(mockPush).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('pushes the launch path once and not again after a remount', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(PLAYLIST_URL)
    try {
      const first = await renderHook(() => useColdStartLinkRecovery())

      await advanceToRecovery()

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith(PLAYLIST_PATH)

      await first.unmount()

      await renderHook(() => useColdStartLinkRecovery())
      await advanceToRecovery()

      expect(mockPush).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
    }
  })
})
