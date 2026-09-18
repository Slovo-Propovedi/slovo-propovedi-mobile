import { flushProgress } from '../progressFlusher'
import { createInterruptionResume } from './interruptionResume'
import { watchPageVisibility } from './visibilityWatcher'

interface InterruptionResumeControllerDeps {
  getAudio: () => HTMLAudioElement | null
  mediaSession: { reassert: () => void; updatePositionState: () => void }
  state: { setPosition: (ms: number) => void }
}

export const createInterruptionResumeController = (deps: InterruptionResumeControllerDeps) => {
  const resume = createInterruptionResume({
    mediaSession: deps.mediaSession,
    state: deps.state,
  })

  const flushProgressAtCurrentTime = (): void => {
    const audio = deps.getAudio()
    if (!audio) return
    flushProgress(Math.max(Math.floor(audio.currentTime * 1000), resume.getSnapshotMs()))
  }

  watchPageVisibility(() => {
    const audio = deps.getAudio()
    if (!audio) return
    deps.mediaSession.reassert()
    resume.maybeRestore(audio)
  })

  return { flushProgressAtCurrentTime, resume }
}
