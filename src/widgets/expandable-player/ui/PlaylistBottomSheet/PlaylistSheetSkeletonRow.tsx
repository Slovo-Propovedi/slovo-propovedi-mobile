import { View, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import type { createStyles } from './PlaylistBottomSheet.styles'

interface PlaylistSheetSkeletonRowProps {
  style: AnimatedStyle<ViewStyle>
  styles: ReturnType<typeof createStyles>
}

export const PlaylistSheetSkeletonRow = ({ style, styles }: PlaylistSheetSkeletonRowProps) => (
  <Animated.View style={[styles.skeletonRow, style]}>
    <View style={[styles.skeletonArt, styles.skeletonBase]} />
    <View style={styles.skeletonTextColumn}>
      <View style={[styles.skeletonTitle, styles.skeletonBase]} />
      <View style={[styles.skeletonSubtitle, styles.skeletonBase]} />
    </View>
  </Animated.View>
)
