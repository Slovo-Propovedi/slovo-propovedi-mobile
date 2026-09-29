import { StyleSheet, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'

const BAR_HEIGHT = 2
const TRACK_OPACITY = 0.3
const TRACK_BOTTOM_OFFSET = 4
const TRACK_HORIZONTAL_INSET = 10

export const ProgressBar = ({ progress }: { progress: number }) => {
  const { currentTheme } = useTheme()
  const clampedProgress = Math.min(Math.max(progress, 0), 1)

  return (
    <View
      style={[styles.track, { backgroundColor: currentTheme.textMuted, opacity: TRACK_OPACITY }]}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: currentTheme.primary, width: `${clampedProgress * 100}%` },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    height: '100%',
  },
  track: {
    bottom: TRACK_BOTTOM_OFFSET,
    height: BAR_HEIGHT,
    left: TRACK_HORIZONTAL_INSET,
    position: 'absolute',
    right: TRACK_HORIZONTAL_INSET,
  },
})
