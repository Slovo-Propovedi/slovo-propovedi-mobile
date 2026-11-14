import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Шапка экрана «Медиа»: заголовок и описание. Действия живут в нативной шапке
// (`headerRight`, см. `useAdminListHeaderActions`).
export const AdminMediaHeader = () => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>Медиа</Text>
      <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
        Библиотека изображений: загрузка и удаление. Обложки переиспользуются в проповедях и
        плейлистах.
      </Text>
    </View>
  )
}
