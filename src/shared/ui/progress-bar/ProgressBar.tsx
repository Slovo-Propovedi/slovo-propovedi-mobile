import { StyleSheet, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'

const BAR_HEIGHT = 2
const TRACK_OPACITY = 0.3

interface ProgressBarProps {
  progress: number
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
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
    bottom: 0,
    height: BAR_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
  },
})
