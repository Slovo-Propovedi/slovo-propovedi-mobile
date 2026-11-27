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

// One vibration per gesture. The window is wide enough to merge any
// same-gesture double pulse — the early-haptic timer pulse plus the release pulse
// coming from a re-granted responder or a mid-gesture remount (both start with a
// clean per-instance dedup flag) — into ONE perceptible vibration. Distinct
// intentional taps are >=200ms apart, so nothing humanly noticeable is lost.
const HAPTIC_THROTTLE_MS = 200
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

const fireImpact = (androidHaptic: AndroidHaptics, iosStyle: ImpactFeedbackStyle): void => {
  if (Platform.OS === 'android') {
    void performAndroidHapticsAsync(androidHaptic).catch(() => {})
    return
  }

  void impactAsync(iosStyle).catch(() => {})
}

// Softest native tick: iOS selection / Android Context_Click (silent on web).
const fireSelectionTick = (): void => {
  if (Platform.OS === 'android') {
    void performAndroidHapticsAsync(AndroidHaptics.Context_Click).catch(() => {})
    return
  }

  void selectionAsync().catch(() => {})
}

// Fire-and-forget press feedback: light impact on iOS, system haptic on Android,
// Vibration API pulse on web (silent no-op where unsupported). Gated by the global
// «Виброотклик» toggle (hapticsEnabledAtom) — disabling it silences presses and
// seek ticks. Cosmetic by design: a rejected promise is swallowed, never thrown.
// Android follows the device's system settings (VIRTUAL_KEY); when system vibration
// feedback is disabled (typical on MIUI), nothing vibrates inside the app.
export const hapticLight = (): void => {
  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') {
    if (!isWebVibrationSupported()) return
    if (isThrottled()) return
    navigator.vibrate(LIGHT_VIBRATION_MS)
    return
  }

  if (isThrottled()) return

  fireImpact(AndroidHaptics.Virtual_Key, ImpactFeedbackStyle.Light)
}

// TEMPORARY capsule diagnostics (remove with the travel-haptics fix).
const logCapsuleHaptic = (kind: string): void => {
  if (globalThis.__CAPSULE_DEBUG__ === true) console.log(`[CAPSULE] haptic ${kind}`)
}

// Light landing pulse when the capsule reaches its tab; silent on web.
export const hapticLanding = (): void => {
  logCapsuleHaptic('landing')

  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') return

  fireImpact(AndroidHaptics.Virtual_Key, ImpactFeedbackStyle.Light)
}

// Softest cue for a travel pass: one selection tick per passed tab.
export const hapticHighlightPass = (): void => {
  logCapsuleHaptic('pass')

  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') return

  fireSelectionTick()
}

// Perceptible tick for continuous value scrubbing (seek slider): iOS uses
// UISelectionFeedbackGenerator (selectionAsync); Android uses Context_Click via
// performAndroidHapticsAsync (the selectionAsync default is imperceptible on
// MIUI); web pulses the Vibration API. No throttle: ticks are >=1s apart. Gated
// by «Виброотклик»; cosmetic like hapticLight — the rejection is swallowed.
export const hapticTick = (): void => {
  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') {
    vibrateWeb(TICK_VIBRATION_MS)
    return
  }

  fireSelectionTick()
}
