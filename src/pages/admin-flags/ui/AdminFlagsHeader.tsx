import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Шапка экрана «Флаги»: заголовок и описание. Действия живут в нативной шапке
// (`headerRight`, см. `useAdminListHeaderActions`).
export const AdminFlagsHeader = () => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Флаги</Text>
      <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
        Управление фича-флагами приложения.
      </Text>
    </View>
  )
}
