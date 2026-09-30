import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Шапка детали раздела: название, описание и действия «Редактировать»/«Удалить».
export const SectionDetailHeader = ({
  description,
  onDelete,
  onEdit,
  title,
}: {
  description: null | string
  onDelete: () => void
  onEdit: () => void
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: currentTheme.textMuted }]}>{description}</Text>
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
