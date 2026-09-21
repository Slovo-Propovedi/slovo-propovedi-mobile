import { useEffect } from 'react'
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

const PULSE_DURATION_MS = 700
const PULSE_MIN_OPACITY = 0.5

export const useSkeletonPulse = () => {
  const pulse = useSharedValue(PULSE_MIN_OPACITY)

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: PULSE_DURATION_MS }), -1, true)

    return () => {
      cancelAnimation(pulse)
    }
  }, [pulse])

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }))

  return { pulseStyle }
}
