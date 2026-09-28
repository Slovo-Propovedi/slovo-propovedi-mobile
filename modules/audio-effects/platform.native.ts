import { requireNativeModule } from 'expo-modules-core'
import { Platform } from 'react-native'
import type { AudioPlayer } from 'expo-audio'
import {
  type AudioEffectsInfo,
  type AudioEffectsSettings,
  DEFAULT_AUDIO_EFFECTS_INFO,
} from './types'

interface AudioEffectsNativeModule {
  attach: (playerHandle: AudioPlayer, settings: AudioEffectsSettings) => Promise<AudioEffectsInfo>
  detach: () => void
  getInfo: () => AudioEffectsInfo
  openOutputSwitcher: () => void
  setBalance: (center: number) => void
  setEqualizerBandGain: (index: number, gainDb: number) => void
  setEqualizerEnabled: (enabled: boolean) => void
  setPitch: (pitch: number, rate: number) => void
}

// The native module is Android-only: on other platforms every call degrades to a no-op.
const isAudioEffectsPlatform = Platform.OS === 'android'

// Resolved once per app run: requireNativeModule throws when the module is
// absent, and re-resolving on every call would repeat the try/catch for nothing.
const nativeModule = (() => {
  if (!isAudioEffectsPlatform) return null
  try {
    return requireNativeModule<AudioEffectsNativeModule>('AudioEffects')
  } catch {
    return null
  }
})()

export const attachAudioEffects = async (
  playerHandle: AudioPlayer,
  settings: AudioEffectsSettings,
): Promise<AudioEffectsInfo> => {
  // The native attach hops to the main queue (ExoPlayer lives there) and
  // resolves the capability snapshot after it — hence the promise.
  if (!nativeModule) return DEFAULT_AUDIO_EFFECTS_INFO
  return nativeModule.attach(playerHandle, settings)
}

export const detachAudioEffects = (): void => nativeModule?.detach()

export const getAudioEffectsInfo = (): AudioEffectsInfo =>
  nativeModule?.getInfo() ?? DEFAULT_AUDIO_EFFECTS_INFO

export const setAudioEffectsBalance = (center: number): void => nativeModule?.setBalance(center)

export const setAudioEffectsEqualizerEnabled = (enabled: boolean): void =>
  nativeModule?.setEqualizerEnabled(enabled)

export const setAudioEffectsEqualizerBandGain = (index: number, gainDb: number): void =>
  nativeModule?.setEqualizerBandGain(index, gainDb)

// `rate` is the JS-known playback speed: the native module rebuilds pitch as
// PlaybackParameters(rate, pitch) from it instead of reading the player
// mid-flight (expo-audio's own rate writes are queued on the same queue).
export const setAudioEffectsPitch = (pitch: number, rate: number): void =>
  nativeModule?.setPitch(pitch, rate)

export const openAudioOutputSwitcher = (): void => nativeModule?.openOutputSwitcher()

// Web-only registration hook: the native chain reaches the player through the
// attach call, so there is nothing to register on native.
export const registerWebAudioElement = (_element: HTMLAudioElement | null): void => {}
