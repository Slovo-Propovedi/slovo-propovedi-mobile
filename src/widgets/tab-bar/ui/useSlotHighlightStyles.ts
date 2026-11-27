import { interpolateColor, type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { getSlotEmphasis, getTravelScale } from '../lib/capsulePulse'
import { getSlotOverlap, type SlotCapsuleMotion } from '../lib/capsuleTravel'

interface SlotHighlightInput {
  collapseProgress: SharedValue<number>
  isActive: boolean
  isDisabled: boolean
  /** Absent outside the bar (standalone rendering): the plain active rule applies. */
  motion: SlotCapsuleMotion | undefined
  palette: { muted: string; primary: string; text: string }
}

// Slot reactions to the traveling capsule: the label and icon colour rise as
// the capsule covers the slot, and the item content pulses with the same
// overlap. All fall back to the static active-route rule while the bar is
// folded.
export const useSlotHighlightStyles = ({
  collapseProgress,
  isActive,
  isDisabled,
  motion,
  palette,
}: SlotHighlightInput) => {
  const colorStyle = useAnimatedStyle(() => {
    if (isDisabled) return { color: palette.muted }

    if (!motion) return { color: isActive ? palette.primary : palette.text }

    const overlap = getSlotOverlap(motion.capsuleCenter.value, motion.slotCenter, motion.slotWidth)

    return {
      color: interpolateColor(
        getSlotEmphasis(overlap, collapseProgress.value, isActive),
        [0, 1],
        [palette.text, palette.primary],
      ),
    }
  })

  const pulseStyle = useAnimatedStyle(() => {
    if (!motion) return {}

    const overlap = getSlotOverlap(motion.capsuleCenter.value, motion.slotCenter, motion.slotWidth)
    const arrivalPulse = motion.isTravelTarget ? motion.arrivalPulse.value : 0

    return {
      transform: [{ scale: getTravelScale(overlap, motion.travelActivity.value, arrivalPulse) }],
    }
  })

  return { colorStyle, pulseStyle }
}
