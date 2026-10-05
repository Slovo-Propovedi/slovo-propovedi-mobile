import { StyleSheet, View } from 'react-native'
import { RADIUSES, useTheme, withAlpha } from 'shared/ui/theme'

const BAR_HEIGHT = 4
const TRACK_OPACITY = 0.3
const PERCENT_MAX = 100

/**
 * Полоса прогресса импорта (0–100): фон-дорожка и заливка цветом темы. В отличие
 * от `shared/ui/progress-bar` (абсолютный overlay на 2 px в строке трека) это
 * потоковый бар под кнопкой импорта, поэтому живёт локально в фиче.
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
      style={[styles.track, { backgroundColor: withAlpha(currentTheme.textMuted, TRACK_OPACITY) }]}
    >
      <View
        style={[styles.fill, { backgroundColor: currentTheme.primary, width: `${percent}%` }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  track: {
    borderRadius: RADIUSES.low,
    height: BAR_HEIGHT,
    overflow: 'hidden',
    width: '100%',
  },
})
