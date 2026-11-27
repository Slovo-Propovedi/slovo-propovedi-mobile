import { capsuleWorkletLog } from './capsuleTravelDebug'
import { type CapsuleFrameState } from './capsuleTravelState'

interface TravelBeats {
  /** The last beat of the trip: the JS surface fires the Medium landing cue. */
  landBeat: boolean
  /** Light beats due this frame (every beat except the last). */
  lightBeats: number
}

// Fires every beat boundary the frame crossed. A long (clamped) frame can cross
// several, so each is still reported exactly once.
export const collectTravelBeats = (state: CapsuleFrameState, progress: number): TravelBeats => {
  'worklet'
  const beatCount = state.beatCount.value
  let landBeat = false
  let lightBeats = 0

  while (state.beatsFired.value < beatCount) {
    const beat = state.beatsFired.value + 1

    if (progress < beat / beatCount) break

    state.beatsFired.value = beat

    capsuleWorkletLog(
      `due gen=${state.travelId.value} beat=${beat}/${beatCount} kind=${
        beat === beatCount ? 'landing' : 'light'
      } center=${state.capsuleCenter.value.toFixed(1)}`,
    )

    if (beat === beatCount) landBeat = true
    else lightBeats += 1
  }

  return { landBeat, lightBeats }
}
