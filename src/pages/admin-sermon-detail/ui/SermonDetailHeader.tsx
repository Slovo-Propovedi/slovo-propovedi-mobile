import { Text, View } from 'react-native'
import { sermonSubtitle } from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Шапка детали проповеди: обложка, название и подпись (проповедник · Писание).
// «Редактировать» и «Удалить» живут в шапке экрана (headerRight).
export const SermonDetailHeader = ({ sermon }: { sermon: APITypes.SermonEntity }) => {
  const { currentTheme } = useTheme()
  const subtitle = sermonSubtitle(sermon)

  return (
    <View style={styles.header}>
      <CoverImage eager uri={sermon.artwork} style={styles.artwork} imageStyle={styles.artwork} />
      <Text style={[styles.title, { color: currentTheme.text }]}>{sermon.title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  )
}
