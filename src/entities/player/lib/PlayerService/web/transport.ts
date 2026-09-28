import type { createInterruptionResumeController } from './interruptionResumeController'
import type { createWebMediaSession } from './mediaSession'
import type { WebPlayerState } from './playerState'
import type { createStatusTracker } from './playerStatusTracker'
import { scheduleHistoryFlush } from '../progressFlusher'
import { reportPlayError } from './audioHandlers'

interface TransportDeps {
  flushProgressAtCurrentTime: () => void
  getAudio: () => HTMLAudioElement | null
  mediaSession: ReturnType<typeof createWebMediaSession>
  resume: ReturnType<typeof createInterruptionResumeController>['resume']
  state: WebPlayerState
  statusTracker: ReturnType<typeof createStatusTracker>
}

/**
 * Transport flows over the live audio element: every flow keeps the
 * interruption-resume snapshot, status tracking and web state in sync, and
 * seeks update the media-session progress bar.
 * @param deps - Accessors and controllers the flows coordinate.
 */
export const createTransport = (deps: TransportDeps) => ({
  pause: async (): Promise<void> => {
    deps.getAudio()?.pause()
    deps.flushProgressAtCurrentTime()
    deps.statusTracker.stop()
    deps.state.setIsPlaying(false)
  },

  play: async (): Promise<void> => {
    const audio = deps.getAudio()

    if (audio) deps.resume.maybeRestore(audio)
    audio?.play().catch(reportPlayError)
    deps.statusTracker.start()
  },

  seekTo: async (newPositionMs: number): Promise<void> => {
    const clampedPositionMs = Math.max(0, newPositionMs)
    deps.resume.noteExplicitPosition(clampedPositionMs)

    const audio = deps.getAudio()
    if (audio) {
      audio.currentTime = clampedPositionMs / 1000
      deps.state.setPosition(clampedPositionMs)
    }

    deps.mediaSession.updatePositionState()
    scheduleHistoryFlush(clampedPositionMs)
  },

  stop: async (): Promise<void> => {
    deps.flushProgressAtCurrentTime()

    const audio = deps.getAudio()
    audio?.pause()
    if (audio) audio.currentTime = 0

    deps.resume.reset(0)
    deps.statusTracker.stop()
    deps.state.setIsPlaying(false)
  },
})
