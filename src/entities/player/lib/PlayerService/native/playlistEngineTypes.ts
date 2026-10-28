import { type AudioPlaylistStatus } from 'expo-audio'

export interface PlaylistEngineCallbacks {
  onStatus: (status: AudioPlaylistStatus) => void
  onTrackChanged: (previousIndex: number, currentIndex: number) => void
}

export interface PlaylistEngineStatus {
  autoAdvanceCount: null | number
  didJustFinish: boolean
  durationMs: number
  isBuffering: boolean
  isLoaded: boolean
  isPlaying: boolean
  playbackRate: number
  positionMs: number
  volume: number
}

export interface TrackSnapshot {
  currentTime: number
  duration: number
}
