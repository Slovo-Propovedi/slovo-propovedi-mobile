import type { StatusCallbacks } from './types'
import type { AudioPlayer, AudioStatus } from 'expo-audio'

const STALE_TRACK_END_TOLERANCE_MS = 3000
const STALE_TRACK_END_WARNING = '[PlayerStatusListener] Ignored stale didJustFinish event'

/**
 * Manages playback status listeners for the audio player.
 * Monitors playing state, position, duration, buffering, and track end events.
 * Detects audio interruptions by comparing previous and current playing states.
 */
class PlayerStatusListener {
  /**
   * Setup playback status listeners on the audio player.
   * @param player - The audio player instance (null to exit early).
   * @param callbacks - Callbacks for status changes.
   */
  public setupListeners(player: AudioPlayer | null, callbacks: StatusCallbacks): void {
    // Guard: early exit for null player
    if (!player) return

    // Cleanup any existing subscriptions before setting up new ones
    this.cleanup()

    this.setupTrackEndListener(player, callbacks.onTrackEnd)
    this.setupPlaybackStatusListener(player, callbacks)
  }

  /**
   * Remove all subscriptions and reset state.
   */
  public cleanup(): void {
    if (this.playbackStatusSubscription) {
      this.playbackStatusSubscription.remove()
      this.playbackStatusSubscription = null
    }

    if (this.trackEndSubscription) {
      this.trackEndSubscription.remove()
      this.trackEndSubscription = null
    }

    this.trackEndHandled = false
    this.wasPlayingBeforeInterruption = false
    this.staleTrackEndWarned = false
    this.listenerArmed = false
  }

  /**
   * Reset the track end handled flag.
   * Used when replacing audio to allow track end events on the new track.
   */
  public resetTrackEndHandled(): void {
    this.trackEndHandled = false
    this.staleTrackEndWarned = false
  }

  private setupTrackEndListener(player: AudioPlayer, onTrackEnd: () => void): void {
    this.trackEndSubscription = player.addListener('playbackStatusUpdate', status => {
      if (!status.didJustFinish) return

      // Guard: ignore until a healthy status of the CURRENT source has been seen — a
      // stale event past the listener-removal window defeats isGenuineTrackEnd
      if (!this.listenerArmed || this.trackEndHandled) return

      // Guard: stale didJustFinish from the previous source (expo-audio #34301) —
      // production Android fires it right after a source change with the old position
      if (!this.isGenuineTrackEnd(status)) {
        this.warnStaleTrackEndOnce()
        return
      }

      this.trackEndHandled = true
      onTrackEnd()
    })
  }

  private isGenuineTrackEnd = (status: AudioStatus): boolean => {
    // Unknown duration — cannot distinguish, treat as genuine
    if (status.duration <= 0) return true

    const remainingMs = Math.floor(status.duration * 1000) - Math.floor(status.currentTime * 1000)

    return remainingMs <= STALE_TRACK_END_TOLERANCE_MS
  }

  private warnStaleTrackEndOnce = (): void => {
    if (this.staleTrackEndWarned) return
    this.staleTrackEndWarned = true
    console.warn(`${STALE_TRACK_END_WARNING} (position far from duration)`)
  }

  private setupPlaybackStatusListener(player: AudioPlayer, callbacks: StatusCallbacks): void {
    this.playbackStatusSubscription = player.addListener('playbackStatusUpdate', status => {
      // Arm the didJustFinish handler on the first healthy tick of the new source
      if (status.isLoaded && status.duration > 0 && !status.didJustFinish) this.listenerArmed = true

      const currentPlaying = status.playing

      callbacks.onPlayingChange(currentPlaying)

      const positionMs = Math.floor(status.currentTime * 1000)
      callbacks.onPositionChange(positionMs)

      const durationMs = Math.floor(status.duration * 1000)
      callbacks.onDurationChange(durationMs)

      callbacks.onBufferingChange(status.isBuffering)

      // Detect audio interruptions: playing changed from true to false (not user-initiated)
      // This happens when phone calls or other audio interruptions occur
      if (this.wasPlayingBeforeInterruption && !currentPlaying) callbacks.onAudioInterruption(true)
      else if (!this.wasPlayingBeforeInterruption && currentPlaying)
        // Audio resumed after interruption
        callbacks.onAudioInterruption(false)

      // Update previous playing state for next iteration
      this.wasPlayingBeforeInterruption = currentPlaying
    })
  }

  private playbackStatusSubscription: { remove: () => void } | null = null
  private trackEndSubscription: { remove: () => void } | null = null
  private trackEndHandled = false
  private wasPlayingBeforeInterruption = false
  private staleTrackEndWarned = false
  private listenerArmed = false
}

export const playerStatusListener = new PlayerStatusListener()
