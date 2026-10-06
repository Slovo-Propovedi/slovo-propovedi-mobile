import { StyleSheet, View } from 'react-native'
import { ProgressBar } from 'shared/ui/progress-bar/ProgressBar'
import { RADIUSES, useTheme, withAlpha } from 'shared/ui/theme'

const BAR_HEIGHT = 4
const TRACK_OPACITY = 0.3
const PERCENT_MAX = 100

/**
 * Полоса прогресса импорта (0–100): переиспользует общую `ProgressBar` (дорожка
 * + заливка), переопределяя её overlay-раскладку на потоковую, высоту и
 * прозрачность дорожки под дизайн блока импорта. Пропорция для общего бара —
 * доля 0–1, поэтому проценты делятся на `PERCENT_MAX`.
 * @param props - Пропсы полосы.
 * @param props.accessibilityLabel - Название фазы для скринридера и тестов.
 * @param props.progress - Прогресс в процентах 0–100.
 */
export const ImportProgressBar = ({
  accessibilityLabel,
  progress,
}: {
  accessibilityLabel: string
  progress: number
}) => {
  const { currentTheme } = useTheme()
  const percent = Math.min(Math.max(progress, 0), PERCENT_MAX)

  return (
    <View
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ max: PERCENT_MAX, min: 0, now: Math.round(percent) }}
    >
      <ProgressBar
        progress={percent / PERCENT_MAX}
        style={[
          styles.bar,
          { backgroundColor: withAlpha(currentTheme.textMuted, TRACK_OPACITY), opacity: 1 },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: RADIUSES.low,
    bottom: 0,
    height: BAR_HEIGHT,
    left: 0,
    overflow: 'hidden',
    position: 'relative',
    right: 0,
    width: '100%',
  },
})
