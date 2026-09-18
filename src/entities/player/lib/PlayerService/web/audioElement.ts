import type { PlaybackRate } from '../../../playback-rate'
import { autoCacheOnPlay } from './autoCache'

export const createWebAudioElement = (
  audioUrl: string,
  playbackRate: PlaybackRate,
): HTMLAudioElement => {
  const audio = new Audio(audioUrl)
  if (playbackRate !== 1) audio.playbackRate = playbackRate
  autoCacheOnPlay(audioUrl)
  return audio
}
