import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics'
import { Platform } from 'react-native'
import { hapticsEnabledAtom } from '../model/settings'
import { ctx } from './reatom-ctx/ctx'

const HAPTIC_THROTTLE_MS = 45
const LIGHT_VIBRATION_MS = 12
const TICK_VIBRATION_MS = 10

let lastHapticAt = 0

// Web Vibration API support. `navigator.vibrate` is missing in most desktop
// browsers and iOS Safari, so the haptics wrappers and the settings row degrade
// to a silent no-op when it is unavailable.
export const isWebVibrationSupported = (): boolean =>
  Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function'

const isThrottled = (): boolean => {
  const now = Date.now()

  if (now - lastHapticAt < HAPTIC_THROTTLE_MS) return true

  lastHapticAt = now

  return false
}

const vibrateWeb = (durationMs: number): void => {
  if (!isWebVibrationSupported()) return

  navigator.vibrate(durationMs)
}

// Fire-and-forget press feedback: light impact on iOS (system Taptic Engine),
// system haptic on Android, Vibration API pulse on web (a silent no-op where the
// API is unavailable). Gated by the global «Виброотклик» toggle
// (hapticsEnabledAtom) — when the user disables haptics, both button presses and
// the seek tick go silent. Cosmetic by design — a haptic must never crash the
// app, so the rejected promise is swallowed intentionally.
// Android uses the system haptic engine (performAndroidHapticsAsync →
// View.performHapticFeedback, VIRTUAL_KEY), so the response follows the device's
// system settings (short/strong as configured by the user); known trade-off —
// when the system vibration feedback is disabled (typical on MIUI), no vibration
// happens inside the app.
export const hapticLight = (): void => {
  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') {
    if (!isWebVibrationSupported()) return
    if (isThrottled()) return
    navigator.vibrate(LIGHT_VIBRATION_MS)
    return
  }

  if (isThrottled()) return

  if (Platform.OS === 'android') {
    void performAndroidHapticsAsync(AndroidHaptics.Virtual_Key).catch(() => {})
    return
  }

  void impactAsync(ImpactFeedbackStyle.Light).catch(() => {})
}

// Perceptible tick for continuous value scrubbing (seek slider): iOS uses
// UISelectionFeedbackGenerator (selectionAsync) — a light selection tick;
// Android uses Context_Click via performAndroidHapticsAsync, because the
// selectionAsync default (CLOCK_TICK) is imperceptible on MIUI; web uses a short
// Vibration API pulse. No throttle: scrub ticks are >=1s apart by design. Gated
// by the same global «Виброотклик» toggle (hapticsEnabledAtom) as press
// feedback — disabling it silences both.
// Cosmetic like hapticLight — rejected promise is swallowed so it can never
// crash the app; silent no-op where the Vibration API is unavailable.
export const hapticTick = (): void => {
  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') {
    vibrateWeb(TICK_VIBRATION_MS)
    return
  }

  if (Platform.OS === 'android') {
    void performAndroidHapticsAsync(AndroidHaptics.Context_Click).catch(() => {})
    return
  }

  void selectionAsync().catch(() => {})
}
