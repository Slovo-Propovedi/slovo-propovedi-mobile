import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics'
import { Platform } from 'react-native'
import {
  hapticHighlightPass,
  hapticLanding,
  hapticLight,
  hapticTick,
  isWebVibrationSupported,
} from './haptics'
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

      jest.setSystemTime(3200)
      hapticLight()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledTimes(2)
    } finally {
      restorePlatform.restore()
    }
  })

  test('merges a same-gesture double pulse (150ms apart) into one vibration', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      // Early-timer pulse, then a release pulse from a re-granted responder:
      // the second one lands well inside the window and stays silent.
      jest.setSystemTime(5000)
      hapticLight()

      jest.setSystemTime(5150)
      hapticLight()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledTimes(1)
      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledWith(AndroidHaptics.Virtual_Key)
    } finally {
      restorePlatform.restore()
    }
  })

  test('swallows Android haptic rejection (no unhandled rejection)', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      jest.setSystemTime(6000)
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

describe('hapticLanding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('triggers a medium impact on iOS', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      hapticLanding()

      expect(mockedImpactAsync).toHaveBeenCalledTimes(1)
      expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Medium)
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('triggers a single Medium impact on Android', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      hapticLanding()

      // AndroidHaptics.Confirm is a double-tick preset; one landing must be a
      // single pulse, so Android uses the same Medium impact as iOS.
      expect(mockedImpactAsync).toHaveBeenCalledTimes(1)
      expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Medium)
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('is a silent no-op on web even with the Vibration API', () => {
    const originalNavigator = globalThis.navigator
    const vibrate = jest.fn()
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { vibrate } })
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      hapticLanding()

      expect(vibrate).not.toHaveBeenCalled()
      expect(mockedImpactAsync).not.toHaveBeenCalled()
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: originalNavigator,
      })
    }
  })

  test('is a no-op when haptics are disabled', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      mockedCtxGet.mockReturnValue(false)
      hapticLanding()

      expect(mockedImpactAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      mockedCtxGet.mockReturnValue(true)
    }
  })
})

describe('hapticHighlightPass', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('triggers a light impact on iOS', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      hapticHighlightPass()

      expect(mockedImpactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Light)
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('triggers the system Virtual_Key haptic on Android', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      hapticHighlightPass()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledWith(AndroidHaptics.Virtual_Key)
      expect(mockedImpactAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('fires every pass instead of throttling like a press pulse', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      // Two intermediate slots fall well inside the 200ms press-throttle window;
      // each pass is a distinct beat, so both must be felt.
      hapticHighlightPass()
      hapticHighlightPass()

      expect(mockedImpactAsync).toHaveBeenCalledTimes(2)
      expect(mockedImpactAsync).toHaveBeenNthCalledWith(1, ImpactFeedbackStyle.Light)
      expect(mockedImpactAsync).toHaveBeenNthCalledWith(2, ImpactFeedbackStyle.Light)
    } finally {
      restorePlatform.restore()
    }
  })

  test('is a silent no-op on web even with the Vibration API', () => {
    const originalNavigator = globalThis.navigator
    const vibrate = jest.fn()
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { vibrate } })
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      hapticHighlightPass()

      expect(vibrate).not.toHaveBeenCalled()
      expect(mockedImpactAsync).not.toHaveBeenCalled()
      expect(mockedPerformAndroidHapticsAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: originalNavigator,
      })
    }
  })

  test('is a no-op when haptics are disabled', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      mockedCtxGet.mockReturnValue(false)
      hapticHighlightPass()

      expect(mockedImpactAsync).not.toHaveBeenCalled()
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

      // A same-gesture follow-up still lands inside the one-vibration window.
      jest.setSystemTime(clock + 150)
      hapticLight()

      expect(vibrate).toHaveBeenCalledTimes(1)

      jest.setSystemTime(clock + 250)
      hapticLight()

      expect(vibrate).toHaveBeenCalledTimes(2)
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
