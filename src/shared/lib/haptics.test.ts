import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
} from 'expo-haptics'
import { Platform } from 'react-native'
import { hapticLight } from './haptics'

const mockedImpactAsync = impactAsync as jest.MockedFunction<typeof impactAsync>
const mockedPerformAndroidHapticsAsync = performAndroidHapticsAsync as jest.MockedFunction<
  typeof performAndroidHapticsAsync
>

describe('hapticLight', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('is a no-op on web', () => {
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
})
