import { Animated, type ColorValue } from 'react-native'

export const TabIndicator = ({
  color,
  opacity,
  position,
  width,
}: {
  color: ColorValue
  opacity: Animated.Value
  position: Animated.Value
  width: Animated.Value
}) => (
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
