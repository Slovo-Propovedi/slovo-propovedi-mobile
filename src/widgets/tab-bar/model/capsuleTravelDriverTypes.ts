import { type FrameInfo, type SharedValue } from 'react-native-reanimated'
import { type MorphFrameHost } from 'shared/lib/hooks/atomMorphClock'
import { type CapsuleSlotRect } from '../lib/capsuleTravel'
import { type CapsuleLanding } from '../lib/capsuleTravelState'

export interface CapsuleTravelDriver {
  arrivalPulse: SharedValue<number>
  attachFrameHost: (host: MorphFrameHost) => () => void
  capsuleCenter: SharedValue<number>
  capsuleWidth: SharedValue<number>
  /** UI-thread step the bar's React surface registers with `useFrameCallback`. */
  frameStep: (frameInfo: FrameInfo) => void
  registerSettledListener: (listener: () => void) => () => void
  /** Test-only: parks the capsule and drops hosts and listeners. */
  reset: () => void
  snapTo: (landing: CapsuleLanding) => void
  travelActivity: SharedValue<number>
  /** Glides to the landing, then overshoots along the trajectory and returns. */
  travelTo: (
    landing: CapsuleLanding,
    slotDistance: number,
    slotRects: readonly CapsuleSlotRect[],
  ) => void
}
