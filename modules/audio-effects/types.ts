import { type AudioPlayer } from 'expo-audio'

export interface AudioEffectsInfo {
  balanceSupported: boolean
  bandCount: number
  bandFrequencies: number[]
  bandRange: [number, number]
  eqSupported: boolean
  outputSwitcherSupported: boolean
  pitchSupported: boolean
}

export interface AudioEffectsSettings {
  balance: number
  eqEnabled: boolean
  eqGains: number[]
  pitch: number
  rate: number
}

export const DEFAULT_AUDIO_EFFECTS_INFO: AudioEffectsInfo = {
  balanceSupported: false,
  bandCount: 0,
  bandFrequencies: [],
  bandRange: [-15, 15],
  eqSupported: false,
  outputSwitcherSupported: false,
  pitchSupported: false,
}

/**
 * The surface every platform implementation exports. `index.ts` re-exports one
 * of them (Metro picks `platform.native.ts` / `platform.web.ts`), so both must
 * stay shape-compatible.
 */
export interface AudioEffectsPlatformModule {
  attachAudioEffects: (
    playerHandle: AudioPlayer,
    settings: AudioEffectsSettings,
  ) => Promise<AudioEffectsInfo>
  detachAudioEffects: () => void
  getAudioEffectsInfo: () => AudioEffectsInfo
  openAudioOutputSwitcher: () => void
  /**
   * Web only: hands the module the live `<audio>` element so the effects graph
   * can route it. No-op on platforms with a native effects chain.
   */
  registerWebAudioElement: (element: HTMLAudioElement | null) => void
  setAudioEffectsBalance: (center: number) => void
  setAudioEffectsEqualizerBandGain: (index: number, gainDb: number) => void
  setAudioEffectsEqualizerEnabled: (enabled: boolean) => void
  setAudioEffectsPitch: (pitch: number, rate: number) => void
}
