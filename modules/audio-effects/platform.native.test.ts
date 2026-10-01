import { type AudioPlayer } from 'expo-audio'
import {
  attachAudioEffects,
  detachAudioEffects,
  getAudioEffectsInfo,
  openAudioOutputSwitcher,
  registerWebAudioElement,
  setAudioEffectsBalance,
  setAudioEffectsEqualizerBandGain,
  setAudioEffectsEqualizerEnabled,
  setAudioEffectsPitch,
} from './platform.native'
import { type AudioEffectsSettings, DEFAULT_AUDIO_EFFECTS_INFO } from './types'

// jest-expo runs on the iOS platform, so `isAudioEffectsPlatform` is false and
// the module resolves to null — the same "no native effects chain" branch every
// non-Android target and any Android device without the module takes.

const player = {} as AudioPlayer
const settings: AudioEffectsSettings = {
  balance: 0,
  eqEnabled: false,
  eqGains: [],
  pitch: 1,
  rate: 1,
}

describe('audio-effects native degradation without the Android module', () => {
  test('attach resolves the default capability snapshot', async () => {
    await expect(attachAudioEffects(player, settings)).resolves.toEqual(DEFAULT_AUDIO_EFFECTS_INFO)
  })

  test('the info getter returns the default capability snapshot', () => {
    expect(getAudioEffectsInfo()).toEqual(DEFAULT_AUDIO_EFFECTS_INFO)
  })

  test('every setter degrades to a no-op that never throws', () => {
    expect(() => setAudioEffectsBalance(0.5)).not.toThrow()
    expect(() => setAudioEffectsEqualizerEnabled(true)).not.toThrow()
    expect(() => setAudioEffectsEqualizerBandGain(0, 3)).not.toThrow()
    expect(() => setAudioEffectsPitch(1.25, 1)).not.toThrow()
    expect(() => detachAudioEffects()).not.toThrow()
    expect(() => openAudioOutputSwitcher()).not.toThrow()
    expect(() => registerWebAudioElement(null)).not.toThrow()
  })
})
