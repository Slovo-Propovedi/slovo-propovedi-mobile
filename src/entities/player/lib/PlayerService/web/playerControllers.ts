import { createInterruptionResumeController } from './interruptionResumeController'
import { createWebMediaSession } from './mediaSession'
import { type WebPlayerState } from './playerState'
import { createStatusTracker } from './playerStatusTracker'
import { type ResumeSeekReassert } from './resumeSeekReassert'
import { createTransport } from './transport'

interface PlayerControllersDeps {
  getAudio: () => HTMLAudioElement | null
  getReconcile: () => ResumeSeekReassert
  state: WebPlayerState
}

/**
 * Wires the web player controllers together. Accessors stay lazy so the
 * controllers can reference the service's live audio element and each other
 * without depending on field-init order.
 * @param deps - Live accessors and the shared web player state.
 */
export const createPlayerControllers = (deps: PlayerControllersDeps) => {
  const statusTracker = createStatusTracker(deps.getAudio, deps.state, deps.getReconcile)
  const mediaSession = createWebMediaSession(
    {
      pause: () => transport.pause(),
      play: () => transport.play(),
      seekTo: positionMs => transport.seekTo(positionMs),
    },
    deps.getAudio,
  )
  const resumeController = createInterruptionResumeController({
    getAudio: deps.getAudio,
    mediaSession,
    state: deps.state,
  })
  const resume = resumeController.resume
  const transport = createTransport({
    flushProgressAtCurrentTime: resumeController.flushProgressAtCurrentTime,
    getAudio: deps.getAudio,
    mediaSession,
    resume,
    state: deps.state,
    statusTracker,
  })

  return { mediaSession, resume, resumeController, statusTracker, transport }
}
