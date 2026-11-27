import { type FrameInfo } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { type MorphFrameHost } from 'shared/lib/hooks/atomMorphClock'
import { stepCapsuleFrame } from '../lib/capsuleTravelFrame'
import {
  beginCapsuleTravel,
  type CapsuleLanding,
  createCapsuleFrameState,
  snapCapsule,
} from '../lib/capsuleTravelState'
import { type CapsuleTravelDriver } from './capsuleTravelDriverTypes'
import { createCapsuleTravelHaptics } from './capsuleTravelHaptics'

// Frame-driven choreography instead of wall-clock `withTiming`: the travel
// advances only as far as the frames it received, so tests can sample it frame
// by frame and a JS stall cannot collapse the animation into its end state.
const createCapsuleTravelDriver = (): CapsuleTravelDriver => {
  const state = createCapsuleFrameState()
  const haptics = createCapsuleTravelHaptics()
  const hosts = new Set<MorphFrameHost>()
  const settledListeners = new Set<() => void>()
  let isRunningFlag = false

  // Opens a new travel generation and mirrors it into the frame state so the
  // worklet can stamp its scheduled callbacks with the id.
  const beginTravel = () => {
    state.travelId.value = haptics.begin()
  }

  // Only the first attached surface steps the clock; the rest stay standby so
  // an unmount hands the travel over to the next mounted bar.
  const syncActiveHosts = () => {
    const [primary] = hosts
    for (const host of hosts) host.setActive(host === primary && isRunningFlag)
  }

  const settle = (travelId: number) => {
    if (!haptics.land(travelId)) return

    isRunningFlag = false
    syncActiveHosts()
    for (const listener of settledListeners) listener()
  }

  const frameStep = (frameInfo: FrameInfo) => {
    'worklet'

    const { landed, passedSlots, travelId } = stepCapsuleFrame(state, frameInfo)

    for (let pass = 0; pass < passedSlots; pass++) scheduleOnRN(haptics.firePass, travelId)

    if (landed) scheduleOnRN(settle, travelId)
  }

  const snapTo = (landing: CapsuleLanding) => {
    beginTravel()
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
      haptics.reset()
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
      // instead of rewinding it to the current frame. No new generation here:
      // the idempotent reconcile must not invalidate the running travel's
      // queued pass/settle events.
      if (isRunningFlag && state.targetCenter.value === landing.center) return

      if (slotDistance <= 0 || state.capsuleCenter.value === landing.center) {
        snapTo(landing)

        return
      }

      beginTravel()
      beginCapsuleTravel(state, landing, slotDistance, slotRects)
      isRunningFlag = true
      syncActiveHosts()
    },
  }
}

export const capsuleTravelDriver = createCapsuleTravelDriver()
