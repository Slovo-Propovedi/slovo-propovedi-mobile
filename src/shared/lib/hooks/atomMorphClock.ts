import { type FrameInfo, makeMutable, type SharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

// Upper bound on a single frame delta: a stalled UI thread reports a
// multi-second delta that would teleport the morph instead of playing frames.
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
// only as far as the frames it received, so a JS stall cannot collapse it into
// its end state. One clock per driver; the React surface supplies the frames.
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

  // JS mirrors: a shared value write from JS lands on the UI thread
  // asynchronously and a same-tick read is stale, so JS decides on these flags.
  let isAnimatingFlag = false
  let generationCounter = 0

  // Only the first attached surface steps the clock: N callbacks would run the
  // morph N times faster; the rest stay standby so an unmount hands it over.
  const syncActiveHosts = () => {
    const [primary] = hosts
    for (const host of hosts) host.setActive(host === primary && isAnimatingFlag)
  }

  const settle = (isTarget: boolean, landedGeneration: number) => {
    if (landedGeneration !== generationCounter) return

    // The UI worklet already stopped the clock; the JS flag drives activation.
    isAnimatingFlag = false
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

    // Landing exactly on the target (never overshooting) keeps the resting
    // geometry and the settle flag in sync: a fractional remainder would only
    // settle on a later frame.
    if (Math.abs(remaining) <= step) {
      progress.value = destination
      isAnimating.value = false
      scheduleOnRN(settle, destination === 1, generation.value)

      return
    }

    progress.value += Math.sign(remaining) * step
  }

  // `destination` must not be named `target`: the parameter would shadow the
  // shared value, turning `target.value` into a property write on a number.
  const start = (destination: number) => {
    generationCounter += 1
    generation.value = generationCounter
    target.value = destination
    isAnimatingFlag = true
    isAnimating.value = true
    syncActiveHosts()
  }

  const snapTo = (value: number) => {
    generationCounter += 1
    generation.value = generationCounter
    isAnimatingFlag = false
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
        // With no host left the clock is parked, so a flip arriving during
        // teardown stays pending for the next mounted surface instead of
        // landing on a dead handle.
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
