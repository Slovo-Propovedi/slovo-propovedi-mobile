import { capsuleTravelDriver } from '../model/capsuleTravelDriver'
import { type CapsuleSlotRect, type SlotCapsuleMotion } from './capsuleTravel'

// Per-slot motion descriptor for the tab buttons: the capsule shared values
// plus the slot's own geometry and whether it is the current destination.
export const createMotionFor =
  (slotRects: readonly CapsuleSlotRect[], activeIndex: number) =>
  (slotIndex: number): SlotCapsuleMotion | undefined => {
    const rect = slotRects[slotIndex]

    if (!rect) return undefined

    return {
      arrivalPulse: capsuleTravelDriver.arrivalPulse,
      capsuleCenter: capsuleTravelDriver.capsuleCenter,
      isTravelTarget: slotIndex === activeIndex,
      slotCenter: rect.center,
      slotWidth: rect.slotWidth,
      travelActivity: capsuleTravelDriver.travelActivity,
    }
  }
