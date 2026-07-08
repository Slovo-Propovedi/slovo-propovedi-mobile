import { Animated } from 'react-native'
import type { ColorValue } from 'react-native'

interface TabIndicatorProps {
  color: ColorValue
  opacity: Animated.Value
  position: Animated.Value
  width: Animated.Value
}

export const TabIndicator = ({ color, opacity, position, width }: TabIndicatorProps) => (
  <Animated.View
    style={{
      backgroundColor: color,
      borderRadius: 20,
      bottom: 12,
      left: 0,
      opacity,
      position: 'absolute',
      top: 12,
      transform: [{ translateX: position }],
      width,
    }}
  />
)
