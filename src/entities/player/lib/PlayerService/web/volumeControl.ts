const MIN_VOLUME = 0
const MAX_VOLUME = 1
const DEFAULT_VOLUME = 1

export interface VolumeControl {
  apply: (volume: number) => void
  get: () => number
}

/**
 * Stored playback volume (0..1) that outlives elements: HTMLMediaElement owns
 * its own volume per instance, so the stored value is re-applied to every
 * freshly created element (see createTrackElement).
 * @param getAudio - Accessor for the live audio element, if any.
 */
export const createVolumeControl = (getAudio: () => HTMLAudioElement | null): VolumeControl => {
  let volume = DEFAULT_VOLUME

  return {
    apply: next => {
      volume = Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, next))

      const audio = getAudio()
      if (audio) audio.volume = volume
    },
    get: () => volume,
  }
}
