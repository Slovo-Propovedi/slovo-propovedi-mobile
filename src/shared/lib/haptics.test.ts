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

  test('triggers a context click on Android', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      // Explicit clock beats the module-level throttle from earlier tests.
      jest.setSystemTime(1000)
      hapticLight()

      expect(mockedPerformAndroidHapticsAsync).toHaveBeenCalledWith(AndroidHaptics.Context_Click)
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
})
