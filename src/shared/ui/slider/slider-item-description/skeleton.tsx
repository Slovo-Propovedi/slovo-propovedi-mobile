import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import { MarqueeTextSkeleton } from '../../marquee-text/skeleton'
import { FONT_SIZES, INDENTS } from '../../theme/themed'

interface SliderItemDescriptionSkeletonProps {
  fontSize?: number
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const SliderItemDescriptionSkeleton = ({
  fontSize = FONT_SIZES.h3,
  style,
  testID,
}: SliderItemDescriptionSkeletonProps) => (
  <View testID={testID} style={[styles.component, style]}>
    <MarqueeTextSkeleton fontSize={fontSize} style={{ width: '100%' }} />
  </View>
)

const styles = StyleSheet.create({
  component: {
    padding: INDENTS.middle,
  },
})
