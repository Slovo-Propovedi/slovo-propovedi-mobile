import type { AudioPlayer } from 'expo-audio'

export interface PlayerActions {
  pause(): Promise<void>
  play(): Promise<void>
  replaceAudio(audioUrl: string, initialPositionMs?: number): Promise<AudioPlayer | null>
}
