import { Animated } from 'react-native'
import { styles } from './styles'

interface TabIndicatorProps {
  opacity: Animated.Value
  position: Animated.Value
  width: Animated.Value
}

export const TabIndicator = ({ opacity, position, width }: TabIndicatorProps) => (
  <Animated.View
    style={[
      styles.indicator,
      {
        opacity,
        transform: [{ translateX: position }],
        width,
      },
    ]}
  />
)
