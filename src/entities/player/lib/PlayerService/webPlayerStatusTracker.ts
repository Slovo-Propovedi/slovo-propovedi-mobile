import type { WebPlayerState } from './webPlayerState'

interface StatusTracker {
  start: () => void
  stop: () => void
}

export const createStatusTracker = (
  getAudio: () => HTMLAudioElement | null,
  state: WebPlayerState,
): StatusTracker => {
  let interval: null | ReturnType<typeof setInterval> = null

  const updateStatus = () => {
    const audio = getAudio()
    if (!audio) return
    state.setIsPlaying(!audio.paused)
    state.setPosition(Math.floor(audio.currentTime * 1000))
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
