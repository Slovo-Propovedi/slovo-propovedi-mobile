import type { StatusCallbacks } from './types'
import type { AudioPlayer } from 'expo-audio'

/**
 * Manages playback status listeners for the audio player.
 * Monitors playing state, position, duration, buffering, and track end events.
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
  }

  private setupTrackEndListener(player: AudioPlayer, onTrackEnd: () => void): void {
    this.trackEndSubscription = player.addListener('playbackStatusUpdate', status => {
      // Guard: prevent duplicate track end handling
      if (status.didJustFinish && !this.trackEndHandled) {
        this.trackEndHandled = true
        onTrackEnd()
      }
    })
  }

  private setupPlaybackStatusListener(player: AudioPlayer, callbacks: StatusCallbacks): void {
    this.playbackStatusSubscription = player.addListener('playbackStatusUpdate', status => {
      callbacks.onPlayingChange(status.playing)

      const positionMs = Math.floor(status.currentTime * 1000)
      callbacks.onPositionChange(positionMs)

      const durationMs = Math.floor(status.duration * 1000)
      callbacks.onDurationChange(durationMs)

      callbacks.onBufferingChange(status.isBuffering)
    })
  }

  private playbackStatusSubscription: { remove: () => void } | null = null
  private trackEndSubscription: { remove: () => void } | null = null
  private trackEndHandled = false
}

export const playerStatusListener = new PlayerStatusListener()
