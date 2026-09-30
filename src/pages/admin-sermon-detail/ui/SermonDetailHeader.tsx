import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { sermonSubtitle } from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Шапка детали проповеди: обложка, название, подпись (проповедник · Писание)
// и действие «Удалить». «Редактировать» живёт в шапке экрана (headerRight).
export const SermonDetailHeader = ({
  onDelete,
  sermon,
}: {
  onDelete: () => void
  sermon: APITypes.SermonEntity
}) => {
  const { currentTheme } = useTheme()
  const subtitle = sermonSubtitle(sermon)

  return (
    <View style={styles.header}>
      <CoverImage eager uri={sermon.artwork} style={styles.artwork} imageStyle={styles.artwork} />
      <Text style={[styles.title, { color: currentTheme.text }]}>{sermon.title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>{subtitle}</Text>
      ) : null}
      <View style={styles.actions}>
        <TouchableItem
          onPress={onDelete}
          style={[styles.actionButton, { backgroundColor: currentTheme.surface }]}
        >
          <Ionicons size={18} name='trash-outline' color={currentTheme.textMuted} />
          <Text style={[styles.actionText, { color: currentTheme.textMuted }]}>Удалить</Text>
        </TouchableItem>
      </View>
    </View>
  )
}
