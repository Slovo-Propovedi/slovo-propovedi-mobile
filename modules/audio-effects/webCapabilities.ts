import { type AudioEffectsInfo } from './types'

// Web band layout: fixed 5-band EQ matching the canonical UI band count and
// `EQUALIZER_BAND_COUNT` on the JS side. Frequencies in Hz.
export const WEB_BAND_FREQUENCIES_HZ = [60, 230, 910, 3600, 14000]

const WEB_BAND_RANGE_DB: [number, number] = [-15, 15]

export const WEB_AUDIO_EFFECTS_INFO: AudioEffectsInfo = {
  balanceSupported: true,
  bandCount: WEB_BAND_FREQUENCIES_HZ.length,
  bandFrequencies: [...WEB_BAND_FREQUENCIES_HZ],
  bandRange: WEB_BAND_RANGE_DB,
  eqSupported: true,
  // The system output panel is an Android-only integration; browsers have no
  // equivalent API to invoke.
  outputSwitcherSupported: false,
  // Web Audio cannot shift the pitch of an HTMLMediaElement stream
  // independently of playback rate.
  pitchSupported: false,
}
