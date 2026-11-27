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

interface CapsuleFrameResult {
  /** The arrival frame: the JS surface commits its settled React state. */
  landed: boolean
  /** Intermediate slots whose bounds the capsule swept into this frame. */
  passedSlots: number
}

const enterPhase = (state: CapsuleFrameState, nextPhase: number) => {
  'worklet'
  state.phase.value = nextPhase
  state.elapsed.value = 0
}

// A pass fires the frame the capsule's swept segment first touches a passed
// slot's bounds — segment overlap, not a point-in-rect test, so a coarse frame
// cannot jump clean over a slot. The per-slot flag keeps it to one pulse per
// travel, mirroring the settle-once contract.
const collectSlotPasses = (state: CapsuleFrameState) => {
  'worklet'
  const segmentLow = Math.min(state.previousCenter.value, state.capsuleCenter.value)
  const segmentHigh = Math.max(state.previousCenter.value, state.capsuleCenter.value)

  state.previousCenter.value = state.capsuleCenter.value

  if (segmentLow === segmentHigh) return 0

  const crossed = [...state.passCrossed.value]
  let passedSlots = 0

  for (let index = 0; index < state.passRects.value.length; index++) {
    if (crossed[index]) continue

    const rect = state.passRects.value[index]

    if (!rect) continue
    if (segmentHigh < rect.center - rect.slotWidth / 2) continue
    if (segmentLow > rect.center + rect.slotWidth / 2) continue

    crossed[index] = true
    passedSlots += 1
  }

  state.passCrossed.value = crossed

  return passedSlots
}

// One UI-thread step of the choreography. Reports the landing frame and how many
// intermediate slots it crossed so the JS surface can cue the right haptics.
export const stepCapsuleFrame = (
  state: CapsuleFrameState,
  frameInfo: FrameInfo,
): CapsuleFrameResult => {
  'worklet'
  if (!state.isRunning.value) return { landed: false, passedSlots: 0 }

  const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 0, MAX_FRAME_DELTA_MS)
  state.elapsed.value += delta

  if (state.phase.value === CAPSULE_PHASE_TRAVEL) {
    const progress = Math.min(1, state.elapsed.value / state.duration.value)
    // Fast-start ease: the highlight leaves the pressed tab immediately and
    // decelerates into the destination (easeInOutSine felt like a delay).
    const eased = easeOutQuad(progress)
    state.capsuleCenter.value =
      state.startCenter.value + (state.targetCenter.value - state.startCenter.value) * eased
    state.capsuleWidth.value =
      state.startWidth.value + (state.targetWidth.value - state.startWidth.value) * eased

    const passedSlots = collectSlotPasses(state)

    if (progress >= 1) {
      state.capsuleCenter.value = state.targetCenter.value
      state.capsuleWidth.value = state.targetWidth.value
      enterPhase(state, CAPSULE_PHASE_OVERSHOOT)
    }

    return { landed: false, passedSlots }
  }

  if (state.phase.value === CAPSULE_PHASE_OVERSHOOT) {
    const progress = Math.min(1, state.elapsed.value / CAPSULE_OVERSHOOT_MS)
    const eased = easeOutQuad(progress)
    state.capsuleCenter.value =
      state.targetCenter.value + state.direction.value * state.overshoot.value * eased
    state.arrivalPulse.value = eased

    if (progress >= 1) enterPhase(state, CAPSULE_PHASE_RETURN)

    return { landed: false, passedSlots: 0 }
  }

  const progress = Math.min(1, state.elapsed.value / CAPSULE_RETURN_MS)
  const eased = easeInOutSine(progress)
  state.capsuleCenter.value =
    state.targetCenter.value + state.direction.value * state.overshoot.value * (1 - eased)
  state.arrivalPulse.value = 1 - eased

  if (progress < 1) return { landed: false, passedSlots: 0 }

  state.capsuleCenter.value = state.targetCenter.value
  state.arrivalPulse.value = 0
  state.travelActivity.value = 0
  state.isRunning.value = false

  return { landed: true, passedSlots: 0 }
}
