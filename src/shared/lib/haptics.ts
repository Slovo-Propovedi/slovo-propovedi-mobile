import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics'
import { Platform } from 'react-native'
import { hapticsEnabledAtom } from '../model/settings'
import { ctx } from './reatom-ctx'

const HAPTIC_THROTTLE_MS = 45

let lastHapticAt = 0

// Fire-and-forget press feedback: light impact on iOS (system Taptic Engine),
// system haptic on Android, silent no-op on web. Cosmetic by design — a haptic
// must never crash the app, so the rejected promise is swallowed intentionally.
// Android uses the system haptic engine (performAndroidHapticsAsync →
// View.performHapticFeedback, VIRTUAL_KEY), so the response follows the
// device's system settings (short/strong as configured by the user); known
// trade-off — when the system vibration feedback is disabled (typical on MIUI),
// no vibration happens inside the app.
export const hapticLight = (): void => {
  if (Platform.OS === 'web') return
  if (!ctx.get(hapticsEnabledAtom)) return

  const now = Date.now()
  if (now - lastHapticAt < HAPTIC_THROTTLE_MS) return

  lastHapticAt = now

  if (Platform.OS === 'android') {
    void performAndroidHapticsAsync(AndroidHaptics.Virtual_Key).catch(() => {})
    return
  }

  void impactAsync(ImpactFeedbackStyle.Light).catch(() => {})
}

// Lighter selection tick (iOS UISelectionFeedbackGenerator / Android CLOCK_TICK)
// intended for continuous value scrubbing (seek slider) — much softer than the
// VIRTUAL_KEY press haptic, so per-second ticks don't buzz. No throttle: scrub
// ticks are >=1s apart by design. Cosmetic like hapticLight — rejected promise
// is swallowed so it can never crash the app; no-op on web.
export const hapticTick = (): void => {
  if (Platform.OS === 'web') return
  if (!ctx.get(hapticsEnabledAtom)) return

  void selectionAsync().catch(() => {})
}
