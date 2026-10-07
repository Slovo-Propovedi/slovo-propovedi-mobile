import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSkeletonPulse } from 'shared/ui/skeleton/useSkeletonPulse'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

export const SearchGroupHeaderSkeleton = () => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  return (
    <View style={styles.header}>
      <Animated.View
        style={[styles.labelBar, { backgroundColor: currentTheme.skeleton }, pulseStyle]}
      />
      <Animated.View
        style={[styles.trailingBar, { backgroundColor: currentTheme.skeleton }, pulseStyle]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  labelBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.lg,
    width: '40%',
  },
  trailingBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.lg,
    width: 32,
  },
})
