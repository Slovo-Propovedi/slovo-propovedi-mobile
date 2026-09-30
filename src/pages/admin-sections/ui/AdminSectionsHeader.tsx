import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Шапка списка разделов: заголовок и кнопка создания.
export const AdminSectionsHeader = ({
  count,
  onCreate,
}: {
  count: number
  onCreate: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Разделы</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
          {count > 0 ? 'Слайдеры главной страницы сайта' : 'Разделов пока нет'}
        </Text>
      </View>
      <TouchableItem
        onPress={onCreate}
        style={[styles.createButton, { backgroundColor: currentTheme.primary }]}
      >
        <Text style={styles.createButtonText}>Создать раздел</Text>
      </TouchableItem>
    </View>
  )
}
