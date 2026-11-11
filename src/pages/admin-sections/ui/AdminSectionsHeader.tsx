import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { RefreshButton } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
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
      <RefreshButton />
      <IconButton
        onPress={onCreate}
        accessibilityLabel='Создать раздел'
        Icon={<Ionicons size={24} name='add-outline' color={currentTheme.primary} />}
      />
    </View>
  )
}
