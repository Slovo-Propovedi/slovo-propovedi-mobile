export const RESUME_GUARD_MIN_MS = 1000

interface InterruptionResumeDeps {
  mediaSession: { updatePositionState: () => void }
  state: { setPosition: (ms: number) => void }
}

export const createInterruptionResume = (deps: InterruptionResumeDeps) => {
  let snapshotMs = 0
  let cancelPendingReapply: (() => void) | null = null

  const getSnapshotMs = (): number => snapshotMs

  const noteLivePosition = (ms: number): void => {
    if (ms > RESUME_GUARD_MIN_MS) snapshotMs = ms
  }

  const noteExplicitPosition = (ms: number): void => {
    snapshotMs = Math.max(0, ms)
    cancelPendingReapply?.()
    cancelPendingReapply = null
  }

  const reset = (ms = 0): void => {
    snapshotMs = ms
    cancelPendingReapply?.()
    cancelPendingReapply = null
  }

  const applyRestore = (audio: HTMLAudioElement, ms: number): void => {
    cancelPendingReapply?.()
    cancelPendingReapply = null
    if (audio.readyState === 0) {
      const reapplyAfterLoad = (): void => {
        audio.removeEventListener('loadedmetadata', reapplyAfterLoad)
        if (audio.currentTime * 1000 < RESUME_GUARD_MIN_MS) audio.currentTime = ms / 1000
      }
      audio.addEventListener('loadedmetadata', reapplyAfterLoad)
      cancelPendingReapply = () => audio.removeEventListener('loadedmetadata', reapplyAfterLoad)
    }
    audio.currentTime = ms / 1000
    deps.state.setPosition(ms)
    deps.mediaSession.updatePositionState()
  }

  const maybeRestore = (audio: HTMLAudioElement): boolean => {
    if (snapshotMs <= RESUME_GUARD_MIN_MS) return false
    if (audio.currentTime * 1000 >= RESUME_GUARD_MIN_MS) return false
    applyRestore(audio, snapshotMs)
    return true
  }

  return {
    applyRestore,
    getSnapshotMs,
    maybeRestore,
    noteExplicitPosition,
    noteLivePosition,
    reset,
  }
}
