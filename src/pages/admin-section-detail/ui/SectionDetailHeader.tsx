import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Шапка детали раздела: название, описание и действие «Удалить».
// «Редактировать» живёт в шапке экрана (headerRight).
export const SectionDetailHeader = ({
  description,
  onDelete,
  title,
}: {
  description: null | string
  onDelete: () => void
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
