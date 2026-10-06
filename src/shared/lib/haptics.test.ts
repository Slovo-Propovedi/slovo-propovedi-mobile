import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics'
import { Platform } from 'react-native'
import { hapticLight, hapticTick, isWebVibrationSupported } from './haptics'
import { ctx } from './reatom-ctx/ctx'

jest.mock('./reatom-ctx/ctx', () => ({
  ctx: { get: jest.fn(() => true) },
}))

const mockedImpactAsync = impactAsync as jest.MockedFunction<typeof impactAsync>
const mockedPerformAndroidHapticsAsync = performAndroidHapticsAsync as jest.MockedFunction<
  typeof performAndroidHapticsAsync
>
const mockedSelectionAsync = selectionAsync as jest.MockedFunction<typeof selectionAsync>
const mockedCtxGet = ctx.get as jest.Mock

describe('hapticLight', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('is a no-op on web without the Vibration API', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      hapticLight()

      expect(mockedImpactAsync).not.toHaveBeenCalled()
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('triggers a system haptic on Android', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      // Explicit clock beats the module-level throttle from earlier tests.
      jest.setSystemTime(1000)
      hapticLight()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledWith(AndroidHaptics.Virtual_Key)
      expect(mockedImpactAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('triggers a light impact on iOS', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      jest.setSystemTime(2000)
      hapticLight()

      expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Light)
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('throttles rapid presses to one haptic per window', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      jest.setSystemTime(3000)
      hapticLight()
      hapticLight()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledTimes(1)

      jest.setSystemTime(3050)
      hapticLight()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledTimes(2)
    } finally {
      restorePlatform.restore()
    }
  })

  test('swallows Android haptic rejection (no unhandled rejection)', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      jest.setSystemTime(4000)
      mockedPerformAndroidHapticsAsync.mockRejectedValueOnce(new Error('haptic failed'))

      hapticLight()
      // Flush the microtask queue: an unhandled rejection would fail the test.
      await Promise.resolve()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledWith(AndroidHaptics.Virtual_Key)
    } finally {
      restorePlatform.restore()
    }
  })

  test('is a no-op when haptics are disabled', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      mockedCtxGet.mockReturnValue(false)
      hapticLight()

      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
      expect(mockedImpactAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      mockedCtxGet.mockReturnValue(true)
    }
  })
})

describe('hapticTick', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('is a no-op on web without the Vibration API', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      hapticTick()

      expect(mockedSelectionAsync).not.toHaveBeenCalled()
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('triggers a Context_Click tick on Android', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      hapticTick()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledWith(AndroidHaptics.Context_Click)
      expect(mockedSelectionAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('triggers a selection tick on iOS', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      hapticTick()

      expect(mockedSelectionAsync).toHaveBeenCalledTimes(1)
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('swallows Android haptic rejection (no unhandled rejection)', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      mockedPerformAndroidHapticsAsync.mockRejectedValueOnce(new Error('haptic failed'))

      hapticTick()
      // Flush the microtask queue: an unhandled rejection would fail the test.
      await Promise.resolve()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledWith(AndroidHaptics.Context_Click)
    } finally {
      restorePlatform.restore()
    }
  })

  test('is a no-op when haptics are disabled', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      mockedCtxGet.mockReturnValue(false)
      hapticTick()

      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
      expect(mockedSelectionAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      mockedCtxGet.mockReturnValue(true)
    }
  })
})

describe('web vibration', () => {
  const vibrate = jest.fn()
  const originalNavigator = globalThis.navigator
  // Each test jumps the clock far forward so the module-level throttle from a
  // previous test never suppresses the pulse under assertion.
  let clock = 8_000_000_000_000_000

  const setNavigator = (value: unknown) =>
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    clock += 10_000
    jest.setSystemTime(clock)
    setNavigator({ vibrate })
  })

  afterEach(() => {
    setNavigator(originalNavigator)
    jest.useRealTimers()
  })

  test('isWebVibrationSupported is false without navigator.vibrate', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      setNavigator({})

      expect(isWebVibrationSupported()).toBe(false)
    } finally {
      restorePlatform.restore()
    }
  })

  test('isWebVibrationSupported is true on web with navigator.vibrate', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      expect(isWebVibrationSupported()).toBe(true)
    } finally {
      restorePlatform.restore()
    }
  })

  test('isWebVibrationSupported is false on native', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      expect(isWebVibrationSupported()).toBe(false)
    } finally {
      restorePlatform.restore()
    }
  })

  test('hapticLight pulses navigator.vibrate on web', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      hapticLight()

      expect(vibrate).toHaveBeenCalledTimes(1)
      expect(vibrate).toHaveBeenCalledWith(expect.any(Number))
      expect(mockedImpactAsync).not.toHaveBeenCalled()
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('hapticTick pulses navigator.vibrate on web', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      hapticTick()

      expect(vibrate).toHaveBeenCalledTimes(1)
      expect(mockedSelectionAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('hapticLight throttles rapid web presses', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      hapticLight()
      hapticLight()

      expect(vibrate).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
    }
  })

  test('hapticLight is silent on web when haptics are disabled', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      mockedCtxGet.mockReturnValue(false)
      hapticLight()

      expect(vibrate).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      mockedCtxGet.mockReturnValue(true)
    }
  })
})
