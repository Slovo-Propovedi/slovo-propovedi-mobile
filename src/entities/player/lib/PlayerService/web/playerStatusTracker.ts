import { type WebPlayerState } from './playerState'
import { PLAYABLE_READY_STATE, type ResumeSeekReassert } from './resumeSeekReassert'

interface StatusTracker {
  start: () => void
  stop: () => void
}

export const createStatusTracker = (
  getAudio: () => HTMLAudioElement | null,
  state: WebPlayerState,
  getReconcile: () => ResumeSeekReassert,
): StatusTracker => {
  let interval: null | ReturnType<typeof setInterval> = null

  const updateStatus = () => {
    const audio = getAudio()
    if (!audio) return
    state.setIsPlaying(!audio.paused)
    state.setPosition(Math.floor(audio.currentTime * 1000))
    getReconcile()(audio)
    // One-directional: repairs a spinner stuck because the playing/loadedmetadata
    // edges never fired (iOS PWA cold start, issue #150); never overrides a
    // legitimate waiting/stall.
    if (!audio.paused && audio.readyState >= PLAYABLE_READY_STATE && state.getState().isBuffering)
      state.setIsBuffering(false)
  }

  const start = () => {
    if (interval) clearInterval(interval)
    interval = setInterval(updateStatus, 500)
  }

  const stop = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  return { start, stop }
}
