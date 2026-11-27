import { clampProgress } from './getIslandMath'

// Content and capsule swell by 4% while the capsule crosses a slot…
const CAPSULE_SLOT_PULSE = 0.04
// …and by 8% more on the destination, at the arrival overshoot.
const CAPSULE_ARRIVAL_PULSE = 0.08

// Shared scale pipeline for the slot content and the traveling capsule: the
// subtle travel pulse only runs while the capsule is in flight, the stronger
// arrival pulse fires once per travel on the destination.
export const getTravelScale = (overlap: number, travelActivity: number, arrivalPulse: number) => {
  'worklet'

  return (
    1 +
    CAPSULE_SLOT_PULSE * clampProgress(overlap) * clampProgress(travelActivity) +
    CAPSULE_ARRIVAL_PULSE * clampProgress(arrivalPulse)
  )
}

// Label/icon emphasis follows the capsule while expanded; once the island folds
// into the circle the plain active-route rule takes over again.
export const getSlotEmphasis = (overlap: number, collapseProgress: number, isActive: boolean) => {
  'worklet'
  const collapse = clampProgress(collapseProgress)

  return clampProgress(overlap) * (1 - collapse) + (isActive ? 1 : 0) * collapse
}
