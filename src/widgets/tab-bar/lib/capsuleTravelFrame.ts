import { type FrameInfo } from 'react-native-reanimated'
import { collectSlotPasses } from './capsuleSlotPasses'
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

interface CapsuleFrameResult {
  /** The arrival frame: the JS surface commits its settled React state. */
  landed: boolean
  /** Intermediate slots whose bounds the capsule swept into this frame. */
  passedSlots: number
  /** Id of the travel this frame belongs to; the JS side drops stale events. */
  travelId: number
}

const enterPhase = (state: CapsuleFrameState, nextPhase: number) => {
  'worklet'
  state.phase.value = nextPhase
  state.elapsed.value = 0
}

// One UI-thread step of the choreography. Reports the landing frame, how many
// intermediate slots it crossed, and the travel id so the JS surface can cue
// the right haptics and drop callbacks a newer travel superseded.
export const stepCapsuleFrame = (
  state: CapsuleFrameState,
  frameInfo: FrameInfo,
): CapsuleFrameResult => {
  'worklet'
  const travelId = state.travelId.value

  if (!state.isRunning.value) return { landed: false, passedSlots: 0, travelId }

  const previousCenter = state.previousCenter.value
  const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 0, MAX_FRAME_DELTA_MS)
  state.elapsed.value += delta

  let landed = false
  let passedSlots = 0

  if (state.phase.value === CAPSULE_PHASE_TRAVEL) {
    const progress = Math.min(1, state.elapsed.value / state.duration.value)
    // Fast-start ease: the highlight leaves the pressed tab immediately and
    // decelerates into the destination (easeInOutSine felt like a delay).
    const eased = easeOutQuad(progress)
    state.capsuleCenter.value =
      state.startCenter.value + (state.targetCenter.value - state.startCenter.value) * eased
    state.capsuleWidth.value =
      state.startWidth.value + (state.targetWidth.value - state.startWidth.value) * eased

    passedSlots = collectSlotPasses(state, previousCenter)

    if (progress >= 1) {
      state.capsuleCenter.value = state.targetCenter.value
      state.capsuleWidth.value = state.targetWidth.value
      enterPhase(state, CAPSULE_PHASE_OVERSHOOT)
    }
  } else if (state.phase.value === CAPSULE_PHASE_OVERSHOOT) {
    const progress = Math.min(1, state.elapsed.value / CAPSULE_OVERSHOOT_MS)
    const eased = easeOutQuad(progress)
    state.capsuleCenter.value =
      state.targetCenter.value + state.direction.value * state.overshoot.value * eased
    state.arrivalPulse.value = eased

    if (progress >= 1) enterPhase(state, CAPSULE_PHASE_RETURN)
  } else {
    const progress = Math.min(1, state.elapsed.value / CAPSULE_RETURN_MS)
    const eased = easeInOutSine(progress)
    state.capsuleCenter.value =
      state.targetCenter.value + state.direction.value * state.overshoot.value * (1 - eased)
    state.arrivalPulse.value = 1 - eased

    if (progress >= 1) {
      state.capsuleCenter.value = state.targetCenter.value
      state.arrivalPulse.value = 0
      state.travelActivity.value = 0
      state.isRunning.value = false
      landed = true
    }
  }

  // Advance the swept-segment origin on EVERY frame, whatever the phase: the
  // next frame's pass test must start where this one ended.
  state.previousCenter.value = state.capsuleCenter.value

  return { landed, passedSlots, travelId }
}
