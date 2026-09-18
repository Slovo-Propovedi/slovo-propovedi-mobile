import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { Platform } from 'react-native'

const HAPTIC_THROTTLE_MS = 45

let lastHapticAt = 0

// Fire-and-forget press feedback: light impact on both mobile platforms, silent
// no-op on web. Cosmetic by design — a haptic must never crash the app, so the
// rejected promise is swallowed intentionally. Android uses the Vibrator API
// (impactAsync) instead of View.performHapticFeedback: MIUI suppresses the
// latter via system settings, while the Vibrator is felt regardless.
export const hapticLight = (): void => {
  if (Platform.OS === 'web') return

  const now = Date.now()
  if (now - lastHapticAt < HAPTIC_THROTTLE_MS) return

  lastHapticAt = now
  void impactAsync(ImpactFeedbackStyle.Light).catch(() => {})
}
