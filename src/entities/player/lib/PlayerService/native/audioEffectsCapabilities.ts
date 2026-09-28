import {
  attachAudioEffects,
  type AudioEffectsInfo,
  type AudioEffectsSettings,
  getAudioEffectsInfo,
} from 'audio-effects'
import { type AudioPlayer } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { audioEffectsInfoAtom } from '../../../audio-settings'

const DEFAULT_BAND_GAIN_DB = 0

const updateInfoAtom = (info: AudioEffectsInfo): void => {
  void ctx.schedule(() => {
    audioEffectsInfoAtom(ctx, info)
  })
}

/**
 * Device band adaptation for persisted gains — pads with zeros or truncates.
 * @param gains - Persisted gains array of any length.
 * @param info - Capability snapshot carrying the device band count.
 * @returns Null when the array already matches the device, else a resized copy.
 */
export const gainsForDevice = (gains: number[], info: AudioEffectsInfo): null | number[] => {
  if (info.bandCount <= 0 || info.bandCount === gains.length) return null

  return Array.from({ length: info.bandCount }, (_, band) => gains[band] ?? DEFAULT_BAND_GAIN_DB)
}

/**
 * Native attach for one player plus capability sync: the attach hop resolves
 * on the main queue, and the resolved snapshot is published to
 * `audioEffectsInfoAtom`.
 * @param player - Expo-audio player the effects chain attaches to.
 * @param settings - Persisted balance / equalizer / pitch / rate snapshot.
 */
export const attachWithCapabilities = async (
  player: AudioPlayer,
  settings: AudioEffectsSettings,
): Promise<AudioEffectsInfo> => {
  const info = await attachAudioEffects(player, settings)

  updateInfoAtom(info)

  return info
}

/**
 * Re-read of the current capabilities without repeating the attach cycle.
 * The audio-session listener recreates the effects mid-playback and the
 * native side cannot push that update to JS.
 */
export const refreshCapabilities = (): void => {
  updateInfoAtom(getAudioEffectsInfo())
}
