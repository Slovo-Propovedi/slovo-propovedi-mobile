import { type AudioPlaylistStatus } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { setIsStalledOfflineAction } from '../../stalledOffline'
import { type StatusCallbacks } from '../types'
import { isGenuineTrackEnd } from './isGenuineTrackEnd'
import { playlistEngine } from './PlaylistEngine'
import { createPlaylistErrorReporter } from './playlistErrorReporter'
import { syncPlaylistStatus } from './playlistStatusSync'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

/**
 * Builds the playlist status consumer: atom sync, interruption edges and the
 * queue-end completion path. Queue end is a single `didJustFinish` at the last
 * media item with loop 'none'; the stale-event guard from the single-player
 * era still applies (expo-audio #34301).
 * Native auto-advance emits `playing:false` while the engine swaps tracks —
 * that edge is not an interruption, so `markAutoAdvanceInFlight` opens a window
 * that the next stable `playing:true` closes. A natural end (`didJustFinish`)
 * is likewise not an interruption: the queue owns what happens next. A failure
 * of the freshly selected track closes the window too: the engine is dead, so
 * its pause edge must flush. Since a natural end no longer produces an
 * interruption edge, the corner where the native advance never started (no
 * `trackChanged`) no longer flushes progress through that edge — flush
 * ownership stays with `trackChanged`/history completion.
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
    // Native resume paths (plain play on the live queue) never clear the stall flag,
    // so a loaded playing status is the playback-resumed edge that must release it.
    if (status.isLoaded && status.playing) void setIsStalledOfflineAction(ctx, false)

    if (status.isLoaded && status.duration > 0 && !status.didJustFinish) armed = true
    if (status.didJustFinish && armed && !queueEndHandled) {
      if (!isGenuineTrackEnd(status)) {
        warnStaleOnce()
        return
      }
      queueEndHandled = true
      void trackAutoAdvanceService.handleQueueEnd()
    }

    // A queue end is never a transition, and a failed fresh track kills the
    // pending advance for good, so their playing edges must be reported.
    if (status.didJustFinish || status.error) autoAdvanceInFlight = false
    // The edge that settles the window is still the transition, not an interruption.
    const suppressEdge = autoAdvanceInFlight
    if (status.playing) autoAdvanceInFlight = false
    // A natural track end is owned by the queue (advance/queue end), never an interruption.
    const isNaturalTrackEnd = status.didJustFinish && !status.playing
    if (wasPlaying !== status.playing && !suppressEdge && !isNaturalTrackEnd)
      callbacks.onAudioInterruption(!status.playing)
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
 * A native failure arrives as a complete status carrying the extra `error` map
 * (the native side merges it into `currentStatus()`), so it is reported and then
 * still flows through the regular handler: the dead-engine playing edge must
 * pause and flush like any other interruption.
 * @param callbacks - Service lifecycle callbacks.
 * @param isMuted - Suppresses status consumption while stopping/unloading.
 */
export const wirePlaylistStatus = (callbacks: StatusCallbacks, isMuted: () => boolean): void => {
  const { handleStatus, markAutoAdvanceInFlight } = createPlaylistStatusHandler(callbacks)
  const errorReporter = createPlaylistErrorReporter()
  playlistEngine.setCallbacks({
    onStatus: status => {
      if (isMuted()) return
      errorReporter.reportStatus(status)
      handleStatus(status)
    },
    onTrackChanged: (previousIndex, currentIndex) => {
      markAutoAdvanceInFlight()
      void trackAutoAdvanceService.handleTrackChanged(previousIndex, currentIndex)
    },
  })
}
