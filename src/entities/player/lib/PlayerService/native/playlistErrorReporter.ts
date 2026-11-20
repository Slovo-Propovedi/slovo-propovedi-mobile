import { type AudioPlaylistStatus } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { setIsStalledOfflineAction } from '../../stalledOffline'
import { reportPlaybackError } from './reportPlaybackError'

type PlaylistError = NonNullable<AudioPlaylistStatus['error']>

const describeError = (error: PlaylistError): string =>
  error.message ?? `PlaybackException ${error.code}`

// The status stream repeats the same native failure on every tick while it
// persists, so the report is keyed by playlist instance, track and error kind:
// a repeated tick stays silent, a different track or failure speaks again.
const buildErrorKey = (status: AudioPlaylistStatus, errorKind: string): string =>
  `${status.id}:${status.currentIndex}:${errorKind}`

/**
 * Builds the native-failure reporter: one report per track and error kind, plus
 * the stalled-offline flag that the reconnect heal consumes (the same flag the
 * buffer-stall path sets in `nativePlayerHelpers`; the existing playing-resumed
 * and queue-build paths clear it). The dedupe state is per wiring, so a rebuilt
 * queue starts clean, and a loaded playing status (recovery) clears it so the
 * next recurrence of the same failure is reported and re-flags the stall.
 */
export const createPlaylistErrorReporter = () => {
  let lastReportedErrorKey: null | string = null

  const reportStatus = (status: AudioPlaylistStatus): void => {
    const error = status.error
    if (!error) {
      // A loaded, playing status is the recovery edge; the next failure on the
      // same track and kind is a new cycle and must be reported again.
      if (status.isLoaded && status.playing) lastReportedErrorKey = null
      return
    }

    const errorKind = describeError(error)
    const errorKey = buildErrorKey(status, errorKind)
    if (errorKey === lastReportedErrorKey) return

    lastReportedErrorKey = errorKey
    reportPlaybackError(errorKind)
    void setIsStalledOfflineAction(ctx, true)
  }

  return { reportStatus }
}
