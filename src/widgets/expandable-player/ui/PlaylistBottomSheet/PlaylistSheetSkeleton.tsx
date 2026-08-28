import { Fragment, useEffect } from 'react'
import { View } from 'react-native'
import { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import type { createStyles } from './PlaylistBottomSheet.styles'
import { PlaylistSheetSkeletonRow } from './PlaylistSheetSkeletonRow'

const SKELETON_ROWS_COUNT = 8
const PULSE_DURATION_MS = 700
const PULSE_MIN_OPACITY = 0.5

interface PlaylistSheetSkeletonProps {
  styles: ReturnType<typeof createStyles>
}

export const PlaylistSheetSkeleton = ({ styles }: PlaylistSheetSkeletonProps) => {
  const pulse = useSharedValue(PULSE_MIN_OPACITY)

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: PULSE_DURATION_MS }), -1, true)
  }, [pulse])

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }))

  return (
    <View pointerEvents='none' testID='playlist-skeleton' style={styles.skeletonOverlay}>
      {Array.from({ length: SKELETON_ROWS_COUNT }, (_, index) => (
        <Fragment key={index}>
          {index > 0 && <View style={styles.divider} />}
          <PlaylistSheetSkeletonRow styles={styles} style={pulseStyle} />
        </Fragment>
      ))}
    </View>
  )
}
