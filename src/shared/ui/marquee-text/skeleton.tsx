import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSkeletonPulse } from '../skeleton/useSkeletonPulse'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES, RADIUSES } from '../theme/themed'

interface MarqueeTextSkeletonProps {
  fontSize?: number
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const MarqueeTextSkeleton = ({
  fontSize = FONT_SIZES.base,
  style,
  testID,
}: MarqueeTextSkeletonProps) => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.skeleton,
        { backgroundColor: currentTheme.skeleton, height: fontSize },
        pulseStyle,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: RADIUSES.low,
    width: '80%',
  },
})
