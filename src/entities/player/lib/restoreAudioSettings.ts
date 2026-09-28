import {
  CURRENT_EQUALIZER_ENABLED,
  CURRENT_EQUALIZER_GAINS,
  CURRENT_SOUND_BALANCE,
  CURRENT_SOUND_PITCH,
} from 'shared/config'
import { balanceSchema, equalizerGainsSchema, pitchSchema } from '../audio-settings'
import { audioEffectsPreferences } from './PlayerService/native/audioEffectsPreferences'

const parseEqGains = (stored: null | string): number[] | undefined => {
  if (!stored) return undefined
  try {
    return equalizerGainsSchema.safeParse(JSON.parse(stored) as unknown).data
  } catch {
    return undefined
  }
}

/**
 * Restores balance / equalizer / pitch from AsyncStorage into the preferences
 * singleton and Reatom atoms. Native effects are NOT touched here: at startup no
 * player exists yet, and the next loadAudio re-attaches with these stored values.
 * @param stored - Flat key/value map from AsyncStorage.multiGet (missing keys are null).
 */
export const restoreAudioSettings = (stored: Record<string, null | string>): void => {
  const storedBalance = stored[CURRENT_SOUND_BALANCE]
  if (storedBalance) {
    const balance = balanceSchema.safeParse(Number(storedBalance))
    if (balance.success) audioEffectsPreferences.setBalance(balance.data)
  }

  const storedEqEnabled = stored[CURRENT_EQUALIZER_ENABLED]
  if (storedEqEnabled !== null) audioEffectsPreferences.setEqEnabled(storedEqEnabled === 'true')

  const eqGains = parseEqGains(stored[CURRENT_EQUALIZER_GAINS] ?? null)
  if (eqGains) audioEffectsPreferences.setEqGains(eqGains)

  const storedPitch = stored[CURRENT_SOUND_PITCH]
  if (storedPitch) {
    const pitch = pitchSchema.safeParse(Number(storedPitch))
    if (pitch.success) audioEffectsPreferences.setPitch(pitch.data)
  }
}
