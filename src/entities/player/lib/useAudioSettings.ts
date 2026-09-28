import { useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import {
  audioEffectsInfoAtom,
  balanceAtom,
  eqEnabledAtom,
  eqGainsAtom,
  EQUALIZER_BAND_COUNT,
  pitchAtom,
} from '../audio-settings'
import { audioEffectsAttach } from './PlayerService/native/audioEffectsAttach'
import { audioEffectsPreferences } from './PlayerService/native/audioEffectsPreferences'

export const useAudioSettings = () => {
  const [balance] = useAtom(balanceAtom)
  const [eqEnabled] = useAtom(eqEnabledAtom)
  const [eqGains] = useAtom(eqGainsAtom)
  const [pitch] = useAtom(pitchAtom)
  const [eqInfo] = useAtom(audioEffectsInfoAtom)

  // Slider count follows the device equalizer (eqInfo.bandCount); the shared
  // constant is the fallback while capabilities are unknown.
  const bandCount = eqInfo?.bandCount || EQUALIZER_BAND_COUNT

  // Safety net: ensure capabilities are known even if the screen mounts long
  // after the last loadAudio (attach is idempotent for the current player).
  useEffect(() => {
    audioEffectsAttach.attachToCurrentPlayer(audioEffectsPreferences)
  }, [])

  const setBalance = (value: number) => audioEffectsPreferences.setBalance(value)
  const setEqEnabled = (value: boolean) => audioEffectsPreferences.setEqEnabled(value)
  const setEqBandGain = (index: number, gainDb: number) =>
    audioEffectsPreferences.setEqBandGain(index, gainDb)
  const setPitch = (value: number) => audioEffectsPreferences.setPitch(value)

  // Live-preview variants for slider drags: native + atom on every tick, no
  // AsyncStorage write — persistence happens on release via the set* above.
  const applyBalance = (value: number) => audioEffectsPreferences.applyBalance(value)
  const applyEqBandGain = (index: number, gainDb: number) =>
    audioEffectsPreferences.applyEqBandGain(index, gainDb)
  const applyPitch = (value: number) => audioEffectsPreferences.applyPitch(value)

  return {
    applyBalance,
    applyEqBandGain,
    applyPitch,
    balance,
    bandCount,
    eqEnabled,
    eqGains,
    eqInfo,
    isEffectsSupported: eqInfo !== null,
    pitch,
    setBalance,
    setEqBandGain,
    setEqEnabled,
    setPitch,
  }
}
