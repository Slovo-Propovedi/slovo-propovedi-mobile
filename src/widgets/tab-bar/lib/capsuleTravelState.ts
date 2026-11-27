import { makeMutable, type SharedValue } from 'react-native-reanimated'
import { CAPSULE_OVERSHOOT_RATIO, type CapsuleSlotRect, getTravelDuration } from './capsuleTravel'

const CAPSULE_PHASE_IDLE = 0
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
  /** Generation the UI-thread sweep bookkeeping currently belongs to. */
  frameTravelId: SharedValue<number>
  isRunning: SharedValue<boolean>
  overshoot: SharedValue<number>
  /** Intermediate slots crossed on the current trip, sampled frame by frame. */
  passCrossed: SharedValue<readonly boolean[]>
  passRects: SharedValue<readonly CapsuleSlotRect[]>
  phase: SharedValue<number>
  /** Capsule centre on the previous frame: the swept segment detects a pass. */
  previousCenter: SharedValue<number>
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
  capsuleCenter: makeMutable(0),
  capsuleWidth: makeMutable(0),
  direction: makeMutable(1),
  duration: makeMutable(0),
  elapsed: makeMutable(0),
  frameTravelId: makeMutable(0),
  isRunning: makeMutable(false),
  overshoot: makeMutable(0),
  passCrossed: makeMutable<readonly boolean[]>([]),
  passRects: makeMutable<readonly CapsuleSlotRect[]>([]),
  phase: makeMutable(CAPSULE_PHASE_IDLE),
  previousCenter: makeMutable(0),
  startCenter: makeMutable(0),
  startWidth: makeMutable(0),
  targetCenter: makeMutable(0),
  targetWidth: makeMutable(0),
  travelActivity: makeMutable(0),
  travelId: makeMutable(0),
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
  slotRects: readonly CapsuleSlotRect[],
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
  state.passRects.value = getPassedRects(slotRects, state.startCenter.value, landing.center)
  state.phase.value = CAPSULE_PHASE_TRAVEL
  state.isRunning.value = true
}

// Intermediate slots are the ones strictly between the trip's endpoints; the
// start and destination themselves are not "passed".
const getPassedRects = (
  slotRects: readonly CapsuleSlotRect[],
  startCenter: number,
  targetCenter: number,
) => {
  const travelLow = Math.min(startCenter, targetCenter)
  const travelHigh = Math.max(startCenter, targetCenter)

  return slotRects.filter(rect => rect.center > travelLow && rect.center < travelHigh)
}
