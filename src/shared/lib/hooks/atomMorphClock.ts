import { type FrameInfo, makeMutable, type SharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

// Upper bound on a single frame delta: a stalled/backgrounded UI thread reports
// a multi-second `timeSincePreviousFrame` that would otherwise teleport the
// morph to its target instead of playing the missed frames.
const MAX_FRAME_DELTA_MS = 100

export interface AtomMorphClock {
  attachFrameHost: (host: MorphFrameHost) => () => void
  frameStep: (frameInfo: FrameInfo) => void
  progress: SharedValue<number>
  reset: () => void
  snapTo: (value: number) => void
  start: (destination: number) => void
}

export interface MorphFrameHost {
  setActive: (active: boolean) => void
}

interface AtomMorphClockConfig {
  durationMs: number
  onSettled: (isTarget: boolean) => void
}

// Frame-driven progress instead of wall-clock `withTiming`: the morph advances
// only as far as the frames it actually received, so a JS stall cannot collapse
// it into its end state. One clock per driver; the React surface provides the
// frame callback, because only a hook can register one with Reanimated.
export const createAtomMorphClock = ({
  durationMs,
  onSettled,
}: AtomMorphClockConfig): AtomMorphClock => {
  const progress = makeMutable(0)
  const isAnimating = makeMutable(false)
  const target = makeMutable(0)
  // Incremented on every start/snap: a settle scheduled by a frame that lands
  // just before an interrupting flip must not report the aborted direction.
  const generation = makeMutable(0)
  const hosts = new Set<MorphFrameHost>()

  // Only the first attached surface steps the clock: N callbacks advancing the
  // same shared value would run the morph N times faster. The rest stay as
  // standby hosts so an unmount hands the clock over instead of stopping it.
  const syncActiveHosts = () => {
    const [primary] = hosts
    for (const host of hosts) host.setActive(host === primary && isAnimating.value)
  }

  const settle = (isTarget: boolean, landedGeneration: number) => {
    if (landedGeneration !== generation.value) return

    syncActiveHosts()
    onSettled(isTarget)
  }

  const frameStep = (frameInfo: FrameInfo) => {
    'worklet'
    if (!isAnimating.value) return

    const destination = target.value
    const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 0, MAX_FRAME_DELTA_MS)
    const step = delta / durationMs
    const remaining = destination - progress.value

    // Landing exactly on the target (never overshooting) keeps the final
    // resting geometry and the settle flag in sync: a frame that leaves a
    // fractional remainder would settle on a later frame instead.
    if (Math.abs(remaining) <= step) {
      progress.value = destination
      isAnimating.value = false
      scheduleOnRN(settle, destination === 1, generation.value)

      return
    }

    progress.value += Math.sign(remaining) * step
  }

  // `destination` must not be named `target`: the parameter would shadow the
  // shared value, turning `target.value` into a property write on a number
  // (the web crash when a route flip passed 0).
  const start = (destination: number) => {
    generation.value += 1
    target.value = destination
    isAnimating.value = true
    syncActiveHosts()
  }

  const snapTo = (value: number) => {
    generation.value += 1
    isAnimating.value = false
    syncActiveHosts()
    progress.value = value
  }

  return {
    attachFrameHost: host => {
      hosts.add(host)
      syncActiveHosts()

      return () => {
        hosts.delete(host)
        host.setActive(false)
        // With no host left the clock is parked at its current value (no
        // frames run), so a flip arriving during teardown stays pending and the
        // next mounted surface resumes it instead of landing on a dead handle.
        syncActiveHosts()
      }
    },
    frameStep,
    progress,
    reset: () => {
      snapTo(0)
      target.value = 0
      for (const host of hosts) host.setActive(false)
      hosts.clear()
    },
    snapTo,
    start,
  }
}
