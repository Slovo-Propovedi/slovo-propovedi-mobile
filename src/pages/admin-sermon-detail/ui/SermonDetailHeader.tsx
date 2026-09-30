import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { sermonSubtitle } from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Шапка детали проповеди: обложка, название, подпись (проповедник · Писание)
// и действия «Редактировать» / «Удалить».
export const SermonDetailHeader = ({
  onDelete,
  onEdit,
  sermon,
}: {
  onDelete: () => void
  onEdit: () => void
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
          onPress={onEdit}
          style={[styles.actionButton, { backgroundColor: currentTheme.surface }]}
        >
          <Ionicons size={18} name='create-outline' color={currentTheme.primary} />
          <Text style={[styles.actionText, { color: currentTheme.primary }]}>Редактировать</Text>
        </TouchableItem>
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
