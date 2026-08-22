/**
 * @file Types for PlayerService decomposition.
 * Contains shared interfaces and types used across native and web implementations.
 */

import type { AudioPlayer } from 'expo-audio'

/**
 * Audio player instance type from expo-audio.
 * Used for native platform implementation.
 */
export type AudioPlayerInstance = AudioPlayer

/**
 * Options for loading audio into the player.
 */
export interface LoadAudioOptions {
  /** URL of the audio file to load. */
  audioUrl: string
  /** Initial playback position in milliseconds (default: 0). */
  initialPositionMs?: number
}

/**
 * Metadata for lock screen / system media controls.
 * Used to display track information on device lock screen and media notifications.
 */
export interface LockScreenMetadata {
  /** Album or playlist title. */
  albumTitle?: string
  /** Artist name. */
  artist?: string
  /** URL to album artwork image, or null when the track has no artwork. */
  artworkUrl?: null | string
  /** Track title (required). */
  title: string
}

/**
 * Current playback status from the audio player.
 * All values are in milliseconds except isPlaying.
 */
export interface PlaybackStatus {
  /** Total track duration in milliseconds. */
  duration: number
  /** Whether the player is currently playing. */
  isPlaying: boolean
  /** Current playback position in milliseconds. */
  position: number
}

/**
 * Listener type for web player state changes.
 * @returns Cleanup function to unsubscribe.
 */
export type StateListener = () => void

/**
 * Callbacks for playback status changes.
 * Used to sync player state with external state management (Reatom).
 */
export interface StatusCallbacks {
  /** Called when audio is interrupted (phone call) or interruption ends. */
  onAudioInterruption: (isInterrupted: boolean) => void
  /** Called when buffering state changes. */
  onBufferingChange: (isBuffering: boolean) => void
  /** Called when track duration becomes available. */
  onDurationChange: (durationMs: number) => void
  /** Called when playing state changes. */
  onPlayingChange: (isPlaying: boolean) => void
  /** Called when playback position changes. */
  onPositionChange: (positionMs: number) => void
  /** Called when track finishes playing. */
  onTrackEnd: () => void
}

/**
 * Web player state returned by getState().
 * Includes all playback information in a single object.
 */
export interface WebPlayerState {
  /** Total track duration in milliseconds. */
  duration: number
  /** Whether the player is buffering. */
  isBuffering: boolean
  /** Whether the player is currently playing. */
  isPlaying: boolean
  /** Current playback position in milliseconds. */
  position: number
}
