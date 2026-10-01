import { useEffect, useRef, useState } from 'react'
import { type LayoutChangeEvent } from 'react-native'
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

/**
 * Drives the popover's height/opacity reveal: the first non-zero layout starts
 * the entrance fade, and every later height change animates the wrapper height.
 * @returns The wrapper/backdrop animated styles and the container layout handler.
 */
export const useMenuRevealAnimation = () => {
  const [hasMeasured, setHasMeasured] = useState(false)
  const lastLayoutHeightRef = useRef<null | number>(null)
  const height = useSharedValue(0)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)
  const isAnimating = useSharedValue(false)

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height: layoutHeight } = event.nativeEvent.layout
    if (layoutHeight <= 0) return
    if (!hasMeasured) setHasMeasured(true)
    if (isAnimating.value) return
    if (lastLayoutHeightRef.current !== layoutHeight) {
      lastLayoutHeightRef.current = layoutHeight
      isAnimating.value = true
      height.value = withTiming(layoutHeight, { duration: 200, easing: Easing.linear }, () => {
        isAnimating.value = false
      })
    }
  }

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 })
    backdropOpacity.value = withTiming(1, { duration: 150 })
  }, [opacity, backdropOpacity])

  const wrapperStyle = useAnimatedStyle(() => {
    if (!hasMeasured) return { opacity: 0 }
    return { height: height.value, opacity: opacity.value }
  })

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  return { backdropStyle, handleLayout, wrapperStyle }
}
