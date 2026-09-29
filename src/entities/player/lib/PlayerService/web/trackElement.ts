import { registerWebAudioElement } from 'audio-effects'
import { type PlaybackRate } from '../../../playback-rate'
import { createWebAudioElement } from './audioElement'

/**
 * Fresh `<audio>` element wired for playback: stored volume applied, and the
 * element handed to the audio-effects module — its web branch builds the Web
 * Audio effects graph (balance/EQ) lazily on the first effect call.
 * @param audioUrl - Track URL to stream.
 * @param playbackRate - Playback speed restored from preferences.
 * @param volume - Stored volume (0..1) to apply to the fresh element.
 */
export const createTrackElement = (
  audioUrl: string,
  playbackRate: PlaybackRate,
  volume: number,
): HTMLAudioElement => {
  const element = createWebAudioElement(audioUrl, playbackRate)
  element.volume = volume
  registerWebAudioElement(element)

  return element
}
