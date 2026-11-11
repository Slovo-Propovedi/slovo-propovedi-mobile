export type ResumeSeekReassert = (audio: HTMLAudioElement) => void

/** HAVE_FUTURE_DATA — the first readyState where WebKit honors seeks for streamed sources. */
export const PLAYABLE_READY_STATE = 3

const RESUME_SEEK_REASSERT_TOLERANCE_MS = 1000

interface ResumeSeekReassertMediaSession {
  updatePositionState: () => void
}

interface ResumeSeekReassertState {
  setPosition: (ms: number) => void
}

/**
 * WebKit drops currentTime seeks applied below HAVE_FUTURE_DATA for streamed
 * sources, and iOS PWA can withhold the playing/loadedmetadata edges after a
 * cold start (issue #150). The status-tracker tick therefore re-applies the
 * stored position once the element is actually playable. One-shot per element
 * so later user seeks are never fought.
 * @param initialPositionMs - Stored position to restore; non-positive disables reasserting.
 * @param state - Web player state that mirrors the restored position.
 * @param mediaSession - Media session whose progress bar is refreshed after a seek.
 */
export const createResumeSeekReassert = (
  initialPositionMs: number,
  state: ResumeSeekReassertState,
  mediaSession: ResumeSeekReassertMediaSession,
): ResumeSeekReassert => {
  let reasserted = false

  return audio => {
    if (initialPositionMs <= 0 || reasserted) return
    if (audio.readyState < PLAYABLE_READY_STATE) return

    reasserted = true
    const positionMs = audio.currentTime * 1000
    if (Math.abs(positionMs - initialPositionMs) <= RESUME_SEEK_REASSERT_TOLERANCE_MS) return

    audio.currentTime = initialPositionMs / 1000
    state.setPosition(initialPositionMs)
    mediaSession.updatePositionState()
  }
}
