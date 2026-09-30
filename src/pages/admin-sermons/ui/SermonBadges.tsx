import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Бейджи наличия медиа в карточке проповеди: аудио / youtube / текст.
// Ничего не показывается, если у проповеди нет ни одного медиа.
export const SermonBadges = ({
  hasAudio,
  hasText,
  hasYoutube,
}: {
  hasAudio: boolean
  hasText: boolean
  hasYoutube: boolean
}) => {
  const { currentTheme } = useTheme()

  if (!hasAudio && !hasText && !hasYoutube) return null

  const badgeStyle = [styles.badge, { backgroundColor: currentTheme.surface }]

  return (
    <View style={styles.badgeRow}>
      {hasAudio ? (
        <View style={badgeStyle}>
          <Text style={[styles.badgeText, { color: currentTheme.primary }]}>аудио</Text>
        </View>
      ) : null}
      {hasYoutube ? (
        <View style={badgeStyle}>
          <Text style={[styles.badgeText, { color: currentTheme.textMuted }]}>youtube</Text>
        </View>
      ) : null}
      {hasText ? (
        <View style={badgeStyle}>
          <Text style={[styles.badgeText, { color: currentTheme.textMuted }]}>текст</Text>
        </View>
      ) : null}
    </View>
  )
}
