import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Шапка экрана «Пользователи»: заголовок и описание. Действия живут в нативной
// шапке (`headerRight`, см. `useAdminListHeaderActions`).
export const AdminUsersHeader = () => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Пользователи</Text>
      <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
        Управление администраторами системы.
      </Text>
    </View>
  )
}
