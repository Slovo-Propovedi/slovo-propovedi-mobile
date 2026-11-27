import { type FrameInfo } from 'react-native-reanimated'
import {
  CAPSULE_OVERSHOOT_MS,
  CAPSULE_RETURN_MS,
  easeInOutSine,
  easeOutQuad,
} from './capsuleTravel'
import {
  CAPSULE_PHASE_OVERSHOOT,
  CAPSULE_PHASE_RETURN,
  CAPSULE_PHASE_TRAVEL,
  type CapsuleFrameState,
} from './capsuleTravelState'

// A stalled UI thread reports a multi-second delta; clamping it keeps a travel
// from teleporting instead of playing its frames.
const MAX_FRAME_DELTA_MS = 100

const enterPhase = (state: CapsuleFrameState, nextPhase: number) => {
  'worklet'
  state.phase.value = nextPhase
  state.elapsed.value = 0
}

// One UI-thread step of the choreography. Returns true on the frame the arrival
// lands, so the JS surface can commit its settled React state.
export const stepCapsuleFrame = (state: CapsuleFrameState, frameInfo: FrameInfo) => {
  'worklet'
  if (!state.isRunning.value) return false

  const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 0, MAX_FRAME_DELTA_MS)
  state.elapsed.value += delta

  if (state.phase.value === CAPSULE_PHASE_TRAVEL) {
    const progress = Math.min(1, state.elapsed.value / state.duration.value)
    const eased = easeInOutSine(progress)
    state.capsuleCenter.value =
      state.startCenter.value + (state.targetCenter.value - state.startCenter.value) * eased
    state.capsuleWidth.value =
      state.startWidth.value + (state.targetWidth.value - state.startWidth.value) * eased

    if (progress >= 1) {
      state.capsuleCenter.value = state.targetCenter.value
      state.capsuleWidth.value = state.targetWidth.value
      enterPhase(state, CAPSULE_PHASE_OVERSHOOT)
    }

    return false
  }

  if (state.phase.value === CAPSULE_PHASE_OVERSHOOT) {
    const progress = Math.min(1, state.elapsed.value / CAPSULE_OVERSHOOT_MS)
    const eased = easeOutQuad(progress)
    state.capsuleCenter.value =
      state.targetCenter.value + state.direction.value * state.overshoot.value * eased
    state.arrivalPulse.value = eased

    if (progress >= 1) enterPhase(state, CAPSULE_PHASE_RETURN)

    return false
  }

  const progress = Math.min(1, state.elapsed.value / CAPSULE_RETURN_MS)
  const eased = easeInOutSine(progress)
  state.capsuleCenter.value =
    state.targetCenter.value + state.direction.value * state.overshoot.value * (1 - eased)
  state.arrivalPulse.value = 1 - eased

  if (progress < 1) return false

  state.capsuleCenter.value = state.targetCenter.value
  state.arrivalPulse.value = 0
  state.travelActivity.value = 0
  state.isRunning.value = false

  return true
}
