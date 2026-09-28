import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import z from 'zod'
import {
  CURRENT_EQUALIZER_ENABLED,
  CURRENT_EQUALIZER_GAINS,
  CURRENT_SOUND_BALANCE,
  CURRENT_SOUND_PITCH,
} from 'shared/config'
import type { AudioEffectsInfo } from 'audio-effects'

export const EQUALIZER_BAND_COUNT = 5

// Storage bound for persisted band gains. The canonical format was 5 bands;
// devices may expose a different count, and gains are resized to the device
// count at the native-attach boundary — so restore must accept arrays of any
// plausible length (capped to keep untrusted AsyncStorage input bounded).
const MAX_PERSISTED_BANDS = 32

export const balanceSchema = z.number().min(-1).max(1)

export const equalizerEnabledSchema = z.boolean()

export const equalizerGainsSchema = z.array(z.number()).min(1).max(MAX_PERSISTED_BANDS)

export const pitchSchema = z.number().min(0.5).max(2)

export const balanceAtom = atom(0, 'balanceAtom')

export const eqEnabledAtom = atom(false, 'eqEnabledAtom')

export const eqGainsAtom = atom<number[]>(
  Array.from({ length: EQUALIZER_BAND_COUNT }, () => 0),
  'eqGainsAtom',
)

export const pitchAtom = atom(1, 'pitchAtom')

// Capabilities reported by the native module on attach. Internal to the slice:
// consumers read it through useAudioSettings, never through the barrel.
export const audioEffectsInfoAtom = atom<AudioEffectsInfo | null>(null, 'audioEffectsInfoAtom')

export const setBalanceAction = action(async (ctx, balance: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_BALANCE, String(balance))
  await ctx.schedule(() => {
    balanceAtom(ctx, balance)
  })
  return balance
}, 'setBalance')

export const setEqEnabledAction = action(async (ctx, enabled: boolean) => {
  await AsyncStorage.setItem(CURRENT_EQUALIZER_ENABLED, String(enabled))
  await ctx.schedule(() => {
    eqEnabledAtom(ctx, enabled)
  })
  return enabled
}, 'setEqEnabled')

export const setEqGainsAction = action(async (ctx, gains: number[]) => {
  await AsyncStorage.setItem(CURRENT_EQUALIZER_GAINS, JSON.stringify(gains))
  await ctx.schedule(() => {
    eqGainsAtom(ctx, gains)
  })
  return gains
}, 'setEqGains')

export const setPitchAction = action(async (ctx, pitch: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_PITCH, String(pitch))
  await ctx.schedule(() => {
    pitchAtom(ctx, pitch)
  })
  return pitch
}, 'setPitch')

// Live-preview path for slider drags: sync atom updates only (audible via the
// native call in audioEffectsPreferences). AsyncStorage is written once per
// gesture by the set*Action counterparts above, on release.
export const applyBalanceAction = action((ctx, balance: number) => {
  balanceAtom(ctx, balance)
  return balance
}, 'applyBalance')

export const applyEqGainsAction = action((ctx, gains: number[]) => {
  eqGainsAtom(ctx, gains)
  return gains
}, 'applyEqGains')

export const applyPitchAction = action((ctx, pitch: number) => {
  pitchAtom(ctx, pitch)
  return pitch
}, 'applyPitch')
