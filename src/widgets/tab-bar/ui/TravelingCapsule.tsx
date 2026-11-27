import { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { getTravelScale } from '../lib/capsulePulse'
import { type CapsuleTravelMotion, getNearestSlotOverlap } from '../lib/capsuleTravel'
import { clampProgress } from '../lib/getIslandMath'
import { ActiveTabCapsule } from './ActiveTabCapsule'
import { highlightStyles } from './highlightStyles'

// The one element that owns the expanded highlight: it glides from slot to
// slot, swelling with each slot it crosses and growing once more on arrival.
// It fades out with the shape morph, handing the highlight to the collapsed
// circle; `resting` re-commits its settled geometry after the animated style
// (the glass theme remount, Issue #63).
export const TravelingCapsule = ({
  motion,
  progress,
  resting,
}: {
  /** Travel values shared with every slot's reaction. */
  motion: CapsuleTravelMotion
  /** Shape axis of the island: 0 expanded, 1 collapsed. */
  progress: SharedValue<number>
  /** Settled destination rect, committed as the last style entry. */
  resting: { left: number; width: number }
}) => {
  const travelStyle = useAnimatedStyle(() => {
    const width = motion.capsuleWidth.value
    const center = motion.capsuleCenter.value
    const scale = getTravelScale(
      getNearestSlotOverlap(center, motion.slotRects),
      motion.travelActivity.value,
      motion.arrivalPulse.value,
    )

    return {
      opacity: 1 - clampProgress(progress.value),
      transform: [{ translateX: center - width / 2 }, { scale }],
      width,
    }
  })
  const restingStyle = { transform: [{ translateX: resting.left }], width: resting.width }

  return <ActiveTabCapsule style={[highlightStyles.travelCapsule, travelStyle, restingStyle]} />
}
