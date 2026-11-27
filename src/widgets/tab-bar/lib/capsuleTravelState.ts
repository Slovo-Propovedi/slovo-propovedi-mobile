import { makeMutable, type SharedValue } from 'react-native-reanimated'
import { CAPSULE_OVERSHOOT_RATIO, getTravelDuration } from './capsuleTravel'

export const CAPSULE_PHASE_IDLE = 0
export const CAPSULE_PHASE_TRAVEL = 1
export const CAPSULE_PHASE_OVERSHOOT = 2
export const CAPSULE_PHASE_RETURN = 3

/** Mutable chassis shared by the JS transitions and the UI-thread frame step. */
export interface CapsuleFrameState {
  arrivalPulse: SharedValue<number>
  capsuleCenter: SharedValue<number>
  capsuleWidth: SharedValue<number>
  direction: SharedValue<number>
  duration: SharedValue<number>
  elapsed: SharedValue<number>
  isRunning: SharedValue<boolean>
  overshoot: SharedValue<number>
  phase: SharedValue<number>
  startCenter: SharedValue<number>
  startWidth: SharedValue<number>
  targetCenter: SharedValue<number>
  targetWidth: SharedValue<number>
  travelActivity: SharedValue<number>
}

export interface CapsuleLanding {
  center: number
  width: number
}

export const createCapsuleFrameState = (): CapsuleFrameState => ({
  arrivalPulse: makeMutable(0),
  capsuleCenter: makeMutable(0),
  capsuleWidth: makeMutable(0),
  direction: makeMutable(1),
  duration: makeMutable(0),
  elapsed: makeMutable(0),
  isRunning: makeMutable(false),
  overshoot: makeMutable(0),
  phase: makeMutable(CAPSULE_PHASE_IDLE),
  startCenter: makeMutable(0),
  startWidth: makeMutable(0),
  targetCenter: makeMutable(0),
  targetWidth: makeMutable(0),
  travelActivity: makeMutable(0),
})

export const snapCapsule = (state: CapsuleFrameState, landing: CapsuleLanding) => {
  state.capsuleCenter.value = landing.center
  state.capsuleWidth.value = landing.width
  state.arrivalPulse.value = 0
  state.travelActivity.value = 0
  state.phase.value = CAPSULE_PHASE_IDLE
  state.elapsed.value = 0
  state.isRunning.value = false
}

export const beginCapsuleTravel = (
  state: CapsuleFrameState,
  landing: CapsuleLanding,
  slotDistance: number,
) => {
  state.startCenter.value = state.capsuleCenter.value
  state.startWidth.value = state.capsuleWidth.value
  state.targetCenter.value = landing.center
  state.targetWidth.value = landing.width
  state.direction.value = Math.sign(landing.center - state.capsuleCenter.value) || 1
  state.overshoot.value = CAPSULE_OVERSHOOT_RATIO * landing.width
  state.duration.value = getTravelDuration(slotDistance)
  state.arrivalPulse.value = 0
  state.travelActivity.value = 1
  state.elapsed.value = 0
  state.phase.value = CAPSULE_PHASE_TRAVEL
  state.isRunning.value = true
}
