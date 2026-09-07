export const updatePositionState = (audio: HTMLAudioElement | null): void => {
  if (!navigator.mediaSession || !audio) return

  const { duration, playbackRate } = audio
  if (!Number.isFinite(duration) || duration <= 0) return

  const position = Math.min(Math.max(audio.currentTime, 0), duration)
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: playbackRate || 1,
      position,
    })
  } catch {
    // Some browsers throw on certain values — never crash playback.
  }
}

export const updatePlaybackState = (audio: HTMLAudioElement | null): void => {
  if (!navigator.mediaSession || !audio) return
  navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing'
}
