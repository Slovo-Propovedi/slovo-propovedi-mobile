export interface ScrollScheduler {
  clearAll: () => void
  scheduleNudge: (cb: () => void) => void
  scheduleTimer: (cb: () => void, delay: number) => void
}

type PendingKind = 'raf' | 'timeout'

// Plain-closure scheduler (no React): owns the cancellable ids for the
// two-frame nudge and the timer-based retries of the auto-scroll. Each id is
// tagged with its kind so clearAll cancels with the matching canceller
// (cancelAnimationFrame vs clearTimeout). On web the rAF and timer id
// namespaces are shared, so a blind dual-cancel could hit the wrong handle —
// today a wrong-namespace cancel is a no-op, but don't rely on it.
export const createScrollScheduler = (): ScrollScheduler => {
  const pending = new Map<number, PendingKind>()

  const track = (id: number, kind: PendingKind): number => {
    pending.set(id, kind)
    return id
  }

  const untrack = (id: number) => {
    pending.delete(id)
  }

  const scheduleNudge = (cb: () => void) => {
    const rafId1 = track(
      requestAnimationFrame(() => {
        const rafId2 = track(
          requestAnimationFrame(() => {
            untrack(rafId1)
            untrack(rafId2)
            cb()
          }),
          'raf',
        )
      }),
      'raf',
    )
  }

  const scheduleTimer = (cb: () => void, delay: number) => {
    const id = track(
      setTimeout(() => {
        untrack(id)
        cb()
      }, delay),
      'timeout',
    )
  }

  const clearAll = () => {
    pending.forEach((kind, id) => {
      if (kind === 'raf') cancelAnimationFrame(id)
      else clearTimeout(id)
    })
    pending.clear()
  }

  return { clearAll, scheduleNudge, scheduleTimer }
}
