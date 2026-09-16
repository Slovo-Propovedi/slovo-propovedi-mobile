import { useEffect } from 'react'
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { TRACK_LIST_ITEM_SIZES } from './styles'

const PULSE_DURATION_MS = 700
const PULSE_MIN_OPACITY = 0.5

interface TracksListItemSkeletonProps {
  style?: StyleProp<ViewStyle>
}

export const TracksListItemSkeleton = ({ style }: TracksListItemSkeletonProps) => {
  const { currentTheme } = useTheme()
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

  return (
    <Animated.View
      pointerEvents='none'
      testID='tracks-list-item-skeleton'
      style={[styles.card, { backgroundColor: currentTheme.skeleton }, pulseStyle, style]}
    >
      <View style={[styles.art, { backgroundColor: currentTheme.card }]} />
      <View style={styles.textColumn}>
        <View style={[styles.titleBar, { backgroundColor: currentTheme.card }]} />
        <View style={[styles.subtitleBar, { backgroundColor: currentTheme.card }]} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  art: {
    borderRadius: RADIUSES.low,
    height: TRACK_LIST_ITEM_SIZES.albumArtSize,
    marginRight: INDENTS.middle,
    width: TRACK_LIST_ITEM_SIZES.albumArtSize,
  },
  card: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.middle,
  },
  subtitleBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.base,
    marginTop: INDENTS.lowest,
    width: '40%',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.md,
    width: '60%',
  },
})
