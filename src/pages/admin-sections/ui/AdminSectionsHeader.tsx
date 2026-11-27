import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { AdminSectionsTopActions } from './AdminSectionsTopActions'
import { styles } from './styles'

// Шапка списка разделов: заголовок и кнопка создания.
export const AdminSectionsHeader = ({
  count,
  onCreate,
  showActions,
}: {
  count: number
  onCreate: () => void
  showActions: boolean
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
      {showActions && <AdminSectionsTopActions onCreate={onCreate} />}
    </View>
  )
}
