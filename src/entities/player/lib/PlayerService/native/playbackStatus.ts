import { type AudioPlayer } from 'expo-audio'
import { type PlaybackStatus } from '../types'

const DEFAULT_PLAYBACK_STATUS: PlaybackStatus = {
  duration: 0,
  isPlaying: false,
  position: 0,
}

export const resolvePlaybackStatus = (player: AudioPlayer | null): PlaybackStatus => {
  if (!player?.isLoaded) return DEFAULT_PLAYBACK_STATUS

  return {
    duration: Math.floor(player.duration * 1000),
    isPlaying: player.playing,
    position: Math.floor(player.currentTime * 1000),
  }
}
