import { makeMutable, type SharedValue } from 'react-native-reanimated'
import { CAPSULE_OVERSHOOT_RATIO, getTravelDuration } from './capsuleTravel'
import { capsuleLog, syncCapsuleDebugFlag } from './capsuleTravelDebug'

const CAPSULE_PHASE_IDLE = 0
export const CAPSULE_PHASE_TRAVEL = 1
export const CAPSULE_PHASE_OVERSHOOT = 2
export const CAPSULE_PHASE_RETURN = 3

/** Mutable chassis shared by the JS transitions and the UI-thread frame step. */
export interface CapsuleFrameState {
  arrivalPulse: SharedValue<number>
  /** Beats the current travel owes: one per slot of distance. */
  beatCount: SharedValue<number>
  /** UI-owned: beats already fired on this generation. */
  beatsFired: SharedValue<number>
  capsuleCenter: SharedValue<number>
  capsuleWidth: SharedValue<number>
  direction: SharedValue<number>
  duration: SharedValue<number>
  elapsed: SharedValue<number>
  /** Generation the UI-thread beat bookkeeping currently belongs to. */
  frameTravelId: SharedValue<number>
  isRunning: SharedValue<boolean>
  overshoot: SharedValue<number>
  phase: SharedValue<number>
  startCenter: SharedValue<number>
  startWidth: SharedValue<number>
  targetCenter: SharedValue<number>
  targetWidth: SharedValue<number>
  travelActivity: SharedValue<number>
  /** Monotonic travel id: stale UI→JS callbacks carry the previous id. */
  travelId: SharedValue<number>
}

export interface CapsuleLanding {
  center: number
  width: number
}

export const createCapsuleFrameState = (): CapsuleFrameState => ({
  arrivalPulse: makeMutable(0),
  beatCount: makeMutable(1),
  beatsFired: makeMutable(0),
  capsuleCenter: makeMutable(0),
  capsuleWidth: makeMutable(0),
  direction: makeMutable(1),
  duration: makeMutable(0),
  elapsed: makeMutable(0),
  frameTravelId: makeMutable(0),
  isRunning: makeMutable(false),
  overshoot: makeMutable(0),
  phase: makeMutable(CAPSULE_PHASE_IDLE),
  startCenter: makeMutable(0),
  startWidth: makeMutable(0),
  targetCenter: makeMutable(0),
  targetWidth: makeMutable(0),
  travelActivity: makeMutable(0),
  travelId: makeMutable(0),
})

export const snapCapsule = (state: CapsuleFrameState, landing: CapsuleLanding) => {
  syncCapsuleDebugFlag()
  state.capsuleCenter.value = landing.center
  state.capsuleWidth.value = landing.width
  state.arrivalPulse.value = 0
  state.travelActivity.value = 0
  state.phase.value = CAPSULE_PHASE_IDLE
  state.elapsed.value = 0
  state.isRunning.value = false
  capsuleLog(`snap gen=${state.travelId.value} center=${landing.center.toFixed(1)}`)
}

export const beginCapsuleTravel = (
  state: CapsuleFrameState,
  landing: CapsuleLanding,
  slotDistance: number,
) => {
  syncCapsuleDebugFlag()
  state.startCenter.value = state.capsuleCenter.value
  state.startWidth.value = state.capsuleWidth.value
  state.targetCenter.value = landing.center
  state.targetWidth.value = landing.width
  state.direction.value = Math.sign(landing.center - state.capsuleCenter.value) || 1
  state.overshoot.value = CAPSULE_OVERSHOOT_RATIO * landing.width
  state.duration.value = getTravelDuration(slotDistance)
  // One beat per slot of travel time: adjacent = 1 (the landing itself),
  // one apart = 2, two apart = 3. The t=0 boundary is deliberately silent.
  state.beatCount.value = Math.max(1, slotDistance)
  state.arrivalPulse.value = 0
  state.travelActivity.value = 1
  state.elapsed.value = 0
  state.phase.value = CAPSULE_PHASE_TRAVEL
  state.isRunning.value = true
  capsuleLog(
    `start gen=${state.travelId.value} from=${state.startCenter.value.toFixed(1)} to=${landing.center.toFixed(1)} dist=${slotDistance} beats=${state.beatCount.value} dur=${state.duration.value}`,
  )
}
