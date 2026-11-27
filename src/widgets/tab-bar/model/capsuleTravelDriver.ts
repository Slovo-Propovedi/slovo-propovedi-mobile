import { type FrameInfo, type SharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { hapticHighlightPass, hapticLanding } from 'shared/lib/haptics'
import { type MorphFrameHost } from 'shared/lib/hooks/atomMorphClock'
import { type CapsuleSlotRect } from '../lib/capsuleTravel'
import { stepCapsuleFrame } from '../lib/capsuleTravelFrame'
import {
  beginCapsuleTravel,
  type CapsuleLanding,
  createCapsuleFrameState,
  snapCapsule,
} from '../lib/capsuleTravelState'

export interface CapsuleTravelDriver {
  arrivalPulse: SharedValue<number>
  attachFrameHost: (host: MorphFrameHost) => () => void
  capsuleCenter: SharedValue<number>
  capsuleWidth: SharedValue<number>
  /** UI-thread step the bar's React surface registers with `useFrameCallback`. */
  frameStep: (frameInfo: FrameInfo) => void
  registerSettledListener: (listener: () => void) => () => void
  /** Test-only: parks the capsule and drops hosts and listeners. */
  reset: () => void
  snapTo: (landing: CapsuleLanding) => void
  travelActivity: SharedValue<number>
  /** Glides to the landing, then overshoots along the trajectory and returns. */
  travelTo: (
    landing: CapsuleLanding,
    slotDistance: number,
    slotRects: readonly CapsuleSlotRect[],
  ) => void
}

// Frame-driven choreography instead of wall-clock `withTiming`: the travel
// advances only as far as the frames it received, so tests can sample it frame
// by frame and a JS stall cannot collapse the animation into its end state.
const createCapsuleTravelDriver = (): CapsuleTravelDriver => {
  const state = createCapsuleFrameState()
  const hosts = new Set<MorphFrameHost>()
  const settledListeners = new Set<() => void>()
  let isRunningFlag = false

  // Only the first attached surface steps the clock; the rest stay standby so
  // an unmount hands the travel over to the next mounted bar.
  const syncActiveHosts = () => {
    const [primary] = hosts
    for (const host of hosts) host.setActive(host === primary && isRunningFlag)
  }

  const settle = () => {
    isRunningFlag = false
    syncActiveHosts()
    hapticLanding()
    for (const listener of settledListeners) listener()
  }

  const frameStep = (frameInfo: FrameInfo) => {
    'worklet'

    const { landed, passedSlots } = stepCapsuleFrame(state, frameInfo)

    for (let pass = 0; pass < passedSlots; pass++) scheduleOnRN(hapticHighlightPass)

    if (landed) scheduleOnRN(settle)
  }

  const snapTo = (landing: CapsuleLanding) => {
    snapCapsule(state, landing)
    isRunningFlag = false
    syncActiveHosts()
  }

  return {
    arrivalPulse: state.arrivalPulse,
    attachFrameHost: host => {
      hosts.add(host)
      syncActiveHosts()

      return () => {
        hosts.delete(host)
        host.setActive(false)
        syncActiveHosts()
      }
    },
    capsuleCenter: state.capsuleCenter,
    capsuleWidth: state.capsuleWidth,
    frameStep,
    registerSettledListener: listener => {
      settledListeners.add(listener)

      return () => {
        settledListeners.delete(listener)
      }
    },
    reset: () => {
      snapTo({ center: 0, width: 0 })
      for (const host of hosts) host.setActive(false)
      hosts.clear()
      settledListeners.clear()
    },
    snapTo,
    travelActivity: state.travelActivity,
    travelTo: (landing, slotDistance, slotRects) => {
      // A press starts the travel synchronously; the route-render effect then
      // reconciles with the same destination. Keep the already-running trip
      // instead of rewinding it to the current frame.
      if (isRunningFlag && state.targetCenter.value === landing.center) return

      if (slotDistance <= 0 || state.capsuleCenter.value === landing.center) {
        snapTo(landing)

        return
      }

      beginCapsuleTravel(state, landing, slotDistance, slotRects)
      isRunningFlag = true
      syncActiveHosts()
    },
  }
}

export const capsuleTravelDriver = createCapsuleTravelDriver()
