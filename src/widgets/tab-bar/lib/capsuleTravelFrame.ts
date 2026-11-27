import { type FrameInfo } from 'react-native-reanimated'
import {
  CAPSULE_OVERSHOOT_MS,
  CAPSULE_RETURN_MS,
  easeInOutSine,
  easeOutQuad,
} from './capsuleTravel'
import { collectTravelBeats } from './capsuleTravelBeats'
import { capsuleWorkletLog } from './capsuleTravelDebug'
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
  /** The last beat of the trip: the JS surface fires the Medium landing cue. */
  landBeat: boolean
  /** Light beats due this frame (every beat except the last). */
  lightBeats: number
  /** Spring-back finished: the JS surface commits its settled React state. */
  settled: boolean
  /** Id of the travel this frame belongs to; the JS side drops stale events. */
  travelId: number
}

const enterPhase = (state: CapsuleFrameState, nextPhase: number) => {
  'worklet'
  state.phase.value = nextPhase
  state.elapsed.value = 0
}

// One UI-thread step of the choreography. Beats are scheduled optimistically
// from the slot distance: the travel time is split evenly, the t=0 boundary is
// silent, every intermediate beat is Light and the final one is the landing.
// The beat cursor is owned by THIS thread: a JS travel start only bumps
// `travelId`, so a late JS write can never rewind fired beats.
export const stepCapsuleFrame = (
  state: CapsuleFrameState,
  frameInfo: FrameInfo,
): CapsuleFrameResult => {
  'worklet'
  const travelId = state.travelId.value

  if (!state.isRunning.value) return { landBeat: false, lightBeats: 0, settled: false, travelId }

  if (state.frameTravelId.value !== travelId) {
    state.frameTravelId.value = travelId
    state.beatsFired.value = 0
  }

  const delta = Math.min(frameInfo.timeSincePreviousFrame ?? 0, MAX_FRAME_DELTA_MS)
  state.elapsed.value += delta

  let landBeat = false
  let lightBeats = 0
  let settled = false

  if (state.phase.value === CAPSULE_PHASE_TRAVEL) {
    const progress = Math.min(1, state.elapsed.value / state.duration.value)
    // Fast-start ease: the highlight leaves the pressed tab immediately and
    // decelerates into the destination (easeInOutSine felt like a delay).
    const eased = easeOutQuad(progress)
    state.capsuleCenter.value =
      state.startCenter.value + (state.targetCenter.value - state.startCenter.value) * eased
    state.capsuleWidth.value =
      state.startWidth.value + (state.targetWidth.value - state.startWidth.value) * eased

    // Fire every beat boundary the frame crossed. A long (clamped) frame can
    // cross several, so each is reported exactly once.
    const beats = collectTravelBeats(state, progress)

    landBeat = beats.landBeat
    lightBeats = beats.lightBeats

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
      settled = true
    }
  }

  capsuleWorkletLog(
    `frame gen=${travelId} phase=${state.phase.value} center=${state.capsuleCenter.value.toFixed(
      1,
    )} elapsed=${state.elapsed.value.toFixed(0)}`,
  )

  return { landBeat, lightBeats, settled, travelId }
}
