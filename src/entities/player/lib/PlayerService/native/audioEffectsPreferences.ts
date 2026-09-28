import {
  type AudioEffectsInfo,
  type AudioEffectsSettings,
  setAudioEffectsBalance,
  setAudioEffectsEqualizerBandGain,
  setAudioEffectsEqualizerEnabled,
  setAudioEffectsPitch,
} from 'audio-effects'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  applyBalanceAction,
  applyEqGainsAction,
  applyPitchAction,
  EQUALIZER_BAND_COUNT,
  setBalanceAction,
  setEqEnabledAction,
  setEqGainsAction,
  setPitchAction,
} from '../../../audio-settings'
import { applyNativeSafely } from './applyNativeSafely'
import { gainsForDevice } from './audioEffectsCapabilities'
import { playbackPreferences } from './playbackPreferences'

const DEFAULT_BALANCE = 0
const DEFAULT_EQ_ENABLED = false
const DEFAULT_PITCH = 1

/**
 * Stored audio-effects values (balance, equalizer, pitch): every setter keeps
 * the store, the native chain and the Reatom atoms in sync. Commit variants
 * (set*) also persist to AsyncStorage; live variants (apply*) skip persistence
 * for slider drags. The attach/detach lifecycle lives in audioEffectsAttach.
 */
class AudioEffectsPreferences {
  // Commit path: live-apply plus the AsyncStorage write (release of a drag,
  // reset button, preset chip, restore from storage).
  public setBalance = (balance: number): void => {
    this.applyBalance(balance)
    void setBalanceAction(ctx, balance)
  }

  // Live path: native call + sync atom update on every drag tick, no persist.
  public applyBalance = (balance: number): void => {
    this.balance = balance
    applyNativeSafely(() => setAudioEffectsBalance(balance))
    applyBalanceAction(ctx, balance)
  }

  public setEqEnabled = (enabled: boolean): void => {
    this.eqEnabled = enabled
    applyNativeSafely(() => setAudioEffectsEqualizerEnabled(enabled))
    void setEqEnabledAction(ctx, enabled)
  }

  public setEqBandGain = (index: number, gainDb: number): void => {
    this.applyEqBandGain(index, gainDb)
    void setEqGainsAction(ctx, this.eqGains)
  }

  public applyEqBandGain = (index: number, gainDb: number): void => {
    if (index < 0 || index >= this.eqGains.length) return
    this.eqGains = this.eqGains.map((gain, bandIndex) => (bandIndex === index ? gainDb : gain))
    applyNativeSafely(() => setAudioEffectsEqualizerBandGain(index, gainDb))
    applyEqGainsAction(ctx, this.eqGains)
  }

  public setEqGains = (gains: number[]): void => {
    if (gains.length === 0) return
    this.eqGains = [...gains]
    applyNativeSafely(() => {
      gains.forEach((gain, index) => setAudioEffectsEqualizerBandGain(index, gain))
    })
    void setEqGainsAction(ctx, this.eqGains)
  }

  public setPitch = (pitch: number): void => {
    this.applyPitch(pitch)
    void setPitchAction(ctx, pitch)
  }

  public applyPitch = (pitch: number): void => {
    this.pitch = pitch
    applyNativeSafely(() => setAudioEffectsPitch(pitch, playbackPreferences.getPlaybackRate()))
    applyPitchAction(ctx, pitch)
  }

  // Rate changes reset pitch natively (expo-audio queues PlaybackParameters(rate, 1f)
  // on the main queue); the re-assert passes the same rate and lands after the reset (FIFO).
  public reassertPitch = (): void => {
    applyNativeSafely(() => setAudioEffectsPitch(this.pitch, playbackPreferences.getPlaybackRate()))
  }

  public getSettings = (): AudioEffectsSettings => ({
    balance: this.balance,
    eqEnabled: this.eqEnabled,
    eqGains: [...this.eqGains],
    pitch: this.pitch,
    rate: playbackPreferences.getPlaybackRate(),
  })

  // Device band count may differ from the canonical array length: attach
  // reports the resized gains back so JS and the native chain stay consistent.
  public syncDeviceGains = (info: AudioEffectsInfo): void => {
    const resized = gainsForDevice(this.eqGains, info)
    if (!resized) return
    this.eqGains = resized
    void setEqGainsAction(ctx, this.eqGains)
  }

  private balance = DEFAULT_BALANCE
  private eqEnabled = DEFAULT_EQ_ENABLED
  private eqGains: number[] = Array.from({ length: EQUALIZER_BAND_COUNT }, () => 0)
  private pitch = DEFAULT_PITCH
}

export const audioEffectsPreferences = new AudioEffectsPreferences()
