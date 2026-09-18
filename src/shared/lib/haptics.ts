import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
} from 'expo-haptics'
import { Platform } from 'react-native'

const HAPTIC_THROTTLE_MS = 45

let lastHapticAt = 0

// Fire-and-forget press feedback: subtle Android-standard click on Android,
// light impact on iOS, silent no-op on web. Cosmetic by design — a haptic
// must never crash the app, so the rejected promise is swallowed
// intentionally. performAndroidHapticsAsync is Android-only (no-op elsewhere).
export const hapticLight = (): void => {
  if (Platform.OS === 'web') return

  const now = Date.now()
  if (now - lastHapticAt < HAPTIC_THROTTLE_MS) return

  lastHapticAt = now
  const feedback =
    Platform.OS === 'android'
      ? performAndroidHapticsAsync(AndroidHaptics.Context_Click)
      : impactAsync(ImpactFeedbackStyle.Light)
  void feedback.catch(() => {})
}
