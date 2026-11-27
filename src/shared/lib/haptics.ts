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

// Landing cue for the liquid tab highlight: one medium impact when the capsule
// settles on its destination tab. Deliberately NOT throttled — it arrives a full
// travel (150–220ms) after the press pulse and is a distinct event, not a repeat
// tap. Native only: the web Vibration API has no meaningful analogue for a
// gliding highlight, so the trip stays silent there even where it exists.
// Both platforms use a Medium impact: Android's `Confirm` preset is a
// double-tick pattern, so it made every landing vibrate twice (and rapid tab
// switches stacked the ticks into an accumulation). Cosmetic like its siblings:
// the rejected promise is swallowed so it can never crash the app.
export const hapticLanding = (): void => {
  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') return

  void impactAsync(ImpactFeedbackStyle.Medium).catch(() => {})
}

// Light cue for the traveling highlight crossing an intermediate slot: one pulse
// per passed tab. Deliberately NOT throttled — consecutive slots land inside the
// press-throttle window, yet each pass is a distinct beat, not a repeat tap.
// Gated by «Виброотклик»; web has no analogue for a gliding highlight (silent).
export const hapticHighlightPass = (): void => {
  if (!ctx.get(hapticsEnabledAtom)) return

  if (Platform.OS === 'web') return

  fireImpact(AndroidHaptics.Virtual_Key, ImpactFeedbackStyle.Light)
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
