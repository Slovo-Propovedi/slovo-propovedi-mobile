import type { AudioPlayer } from 'expo-audio'

export interface OldTrackFlush {
  oldDurationMs: number
  oldPositionMs: number
  oldSermonId: string
}

export interface PlayerActions {
  pause(): Promise<void>
  play(): Promise<void>
  replaceAudio(audioUrl: string, initialPositionMs?: number): Promise<AudioPlayer | null>
}
