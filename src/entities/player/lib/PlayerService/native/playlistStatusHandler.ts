import { type AudioPlaylistStatus } from 'expo-audio'
import { type StatusCallbacks } from '../types'
import { isGenuineTrackEnd } from './isGenuineTrackEnd'
import { playlistEngine } from './PlaylistEngine'
import { syncPlaylistStatus } from './playlistStatusSync'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

/**
 * Builds the playlist status consumer: atom sync, interruption edges and the
 * queue-end completion path. Queue end is a single `didJustFinish` at the last
 * media item with loop 'none'; the stale-event guard from the single-player
 * era still applies (expo-audio #34301).
 * Native auto-advance emits `playing:false` while the engine swaps tracks —
 * that edge is not an interruption, so `markAutoAdvanceInFlight` opens a window
 * that the next stable `playing:true` closes.
 * @param callbacks - Service lifecycle callbacks.
 */
export const createPlaylistStatusHandler = (callbacks: StatusCallbacks) => {
  let wasPlaying = false
  let autoAdvanceInFlight = false
  let armed = false
  let queueEndHandled = false
  let staleWarned = false
  let currentIndex = -1

  const warnStaleOnce = (): void => {
    if (staleWarned) return
    staleWarned = true
    console.warn(
      '[PlaylistStatusHandler] Ignored stale didJustFinish event (position far from duration)',
    )
  }

  const handleStatus = (status: AudioPlaylistStatus): void => {
    if (status.currentIndex !== currentIndex) {
      currentIndex = status.currentIndex
      queueEndHandled = false
      staleWarned = false
    }

    syncPlaylistStatus(status)

    if (status.isLoaded && status.duration > 0 && !status.didJustFinish) armed = true
    if (status.didJustFinish && armed && !queueEndHandled) {
      if (!isGenuineTrackEnd(status)) {
        warnStaleOnce()
        return
      }
      queueEndHandled = true
      void trackAutoAdvanceService.handleQueueEnd()
    }

    if (wasPlaying !== status.playing) {
      // The transition edge of a native auto-advance is not an interruption.
      const suppressEdge = autoAdvanceInFlight
      if (status.playing) autoAdvanceInFlight = false
      if (!suppressEdge) callbacks.onAudioInterruption(!status.playing)
    }
    wasPlaying = status.playing
  }

  const markAutoAdvanceInFlight = (): void => {
    autoAdvanceInFlight = true
  }

  return { handleStatus, markAutoAdvanceInFlight }
}

/**
 * Connects the playlist event stream to the service. Re-wiring on every
 * load/replace resets the per-source arming/dedupe state.
 * @param callbacks - Service lifecycle callbacks.
 * @param isMuted - Suppresses status consumption while stopping/unloading.
 */
export const wirePlaylistStatus = (callbacks: StatusCallbacks, isMuted: () => boolean): void => {
  const { handleStatus, markAutoAdvanceInFlight } = createPlaylistStatusHandler(callbacks)
  playlistEngine.setCallbacks({
    onStatus: status => {
      if (!isMuted()) handleStatus(status)
    },
    onTrackChanged: (previousIndex, currentIndex) => {
      markAutoAdvanceInFlight()
      void trackAutoAdvanceService.handleTrackChanged(previousIndex, currentIndex)
    },
  })
}
