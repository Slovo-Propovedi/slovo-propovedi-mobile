import { type CapsuleFrameState } from './capsuleTravelState'

// A pass fires the frame the capsule's swept segment first touches a passed
// slot's bounds — segment overlap, not a point-in-rect test, so a coarse frame
// cannot jump clean over a slot. The per-slot flag keeps it to one pulse per
// travel, mirroring the settle-once contract.
export const collectSlotPasses = (state: CapsuleFrameState, previousCenter: number) => {
  'worklet'
  const segmentLow = Math.min(previousCenter, state.capsuleCenter.value)
  const segmentHigh = Math.max(previousCenter, state.capsuleCenter.value)

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
