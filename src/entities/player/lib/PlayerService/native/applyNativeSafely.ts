// All native audio-effects calls are best-effort: effects are cosmetic and
// must never crash playback.
export const applyNativeSafely = (apply: () => void): void => {
  try {
    apply()
  } catch (error) {
    console.error('[AudioEffectsPreferences] native call failed:', error)
  }
}
