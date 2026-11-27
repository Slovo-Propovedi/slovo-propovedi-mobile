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
  let lastSettledTravelId = -1

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

  // Spring-back bookkeeping only: the Medium landing cue already fired on the
  // last travel beat, not here. Stale/duplicate deliveries are dropped.
  const settle = (travelId: number) => {
    if (!haptics.isCurrent(travelId) || travelId === lastSettledTravelId) return

    lastSettledTravelId = travelId
    isRunningFlag = false
    syncActiveHosts()
    for (const listener of settledListeners) listener()
  }

  const frameStep = (frameInfo: FrameInfo) => {
    'worklet'

    const { landBeat, lightBeats, settled, travelId } = stepCapsuleFrame(state, frameInfo)

    for (let beat = 0; beat < lightBeats; beat++) scheduleOnRN(haptics.firePass, travelId)

    if (landBeat) scheduleOnRN(haptics.land, travelId)

    if (settled) scheduleOnRN(settle, travelId)
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
      lastSettledTravelId = -1
      haptics.reset()
      snapTo({ center: 0, width: 0 })
      for (const host of hosts) host.setActive(false)
      hosts.clear()
      settledListeners.clear()
    },
    snapTo,
    travelActivity: state.travelActivity,
    travelTo: (landing, slotDistance) => {
      // A press starts the travel synchronously; the route-render effect then
      // reconciles with the same destination. Keep the already-running trip
      // instead of rewinding it to the current frame. No new generation here:
      // the idempotent reconcile must not invalidate the running travel's
      // queued beat events.
      if (isRunningFlag && state.targetCenter.value === landing.center) return

      if (slotDistance <= 0 || state.capsuleCenter.value === landing.center) {
        snapTo(landing)

        return
      }

      beginTravel()
      beginCapsuleTravel(state, landing, slotDistance)
      isRunningFlag = true
      syncActiveHosts()
    },
  }
}

export const capsuleTravelDriver = createCapsuleTravelDriver()
