import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
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
  return (
    <View
      testID={testID}
      style={[styles.skeleton, { backgroundColor: currentTheme.skeleton, height: fontSize }, style]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: RADIUSES.low,
    width: '80%',
  },
})
