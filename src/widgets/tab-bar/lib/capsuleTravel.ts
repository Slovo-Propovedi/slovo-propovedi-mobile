import { type SharedValue } from 'react-native-reanimated'
import { CAPSULE_HORIZONTAL_OVERHANG } from './getIslandStyle'

// One capsule travels from the old active slot to the new one. The per-slot
// widths are known numerically, so the route is derived, never measured.
export interface CapsuleSlotRect {
  /** Width of the traveling capsule when it rests on this slot. */
  capsuleWidth: number
  center: number
  slotWidth: number
}

/** Everything the capsule element itself reads while moving. */
export interface CapsuleTravelMotion {
  arrivalPulse: SharedValue<number>
  capsuleCenter: SharedValue<number>
  capsuleWidth: SharedValue<number>
  slotRects: readonly CapsuleSlotRect[]
  travelActivity: SharedValue<number>
}

/** Geometry a slot needs to react to the capsule passing over it. */
export interface SlotCapsuleMotion {
  arrivalPulse: SharedValue<number>
  capsuleCenter: SharedValue<number>
  /** The slot the capsule is currently traveling to (strong arrival pulse). */
  isTravelTarget: boolean
  slotCenter: number
  slotWidth: number
  travelActivity: SharedValue<number>
}

// Travel timings: one slot is a 150ms glide, every further slot adds 50ms up to
// a 220ms ceiling. Arrival is a 60ms overshoot followed by a 70ms return.
const CAPSULE_TRAVEL_BASE_MS = 100
const CAPSULE_TRAVEL_PER_SLOT_MS = 50
export const CAPSULE_TRAVEL_MAX_MS = 220
export const CAPSULE_OVERSHOOT_MS = 60
export const CAPSULE_RETURN_MS = 70
// The capsule rides this share of its own width past the destination.
export const CAPSULE_OVERSHOOT_RATIO = 0.18
// Two capsule overhangs minus the item's 4dp margin on each side, so the moving
// capsule keeps the footprint of the old per-slot highlight.
const CAPSULE_SLOT_BLEED = CAPSULE_HORIZONTAL_OVERHANG * 2 - 8

export const getTravelDuration = (slotDistance: number) => {
  'worklet'
  const crossedSlots = Math.max(1, slotDistance)

  return Math.min(
    CAPSULE_TRAVEL_MAX_MS,
    CAPSULE_TRAVEL_BASE_MS + CAPSULE_TRAVEL_PER_SLOT_MS * crossedSlots,
  )
}

// Slot rectangles in the island content's coordinate space. The capsule layer
// is absolute in the unpadded content box, so the row's horizontal inset is
// added explicitly: the first slot starts after it (native Yoga offsets an
// absolute child by the parent's padding, CSS does not).
export const getSlotRects = (slotWidths: readonly number[], padding: number) => {
  let left = padding

  return slotWidths.map(slotWidth => {
    const rect = {
      capsuleWidth: slotWidth + CAPSULE_SLOT_BLEED,
      center: left + slotWidth / 2,
      slotWidth,
    }

    left += slotWidth

    return rect
  })
}

export const easeInOutSine = (t: number) => {
  'worklet'

  return -(Math.cos(Math.PI * t) - 1) / 2
}

export const easeOutQuad = (t: number) => {
  'worklet'

  return 1 - (1 - t) * (1 - t)
}

// How much of a slot the capsule covers: full on its centre, zero from half a
// slot away, linear in between — the «water» ripple that lights passed tabs.
export const getSlotOverlap = (capsuleCenter: number, slotCenter: number, slotWidth: number) => {
  'worklet'

  if (slotWidth <= 0) return 0

  return Math.max(0, 1 - Math.abs(capsuleCenter - slotCenter) / (slotWidth / 2))
}

export const getNearestSlotOverlap = (capsuleCenter: number, rects: readonly CapsuleSlotRect[]) => {
  'worklet'
  let nearest = 0

  for (const rect of rects) {
    const overlap = getSlotOverlap(capsuleCenter, rect.center, rect.slotWidth)

    if (overlap > nearest) nearest = overlap
  }

  return nearest
}
