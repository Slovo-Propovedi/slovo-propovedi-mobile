import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { Text } from 'react-native'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Заметная кнопка входа в интерфейс администратора на табе «Еще».
// Рендерится только для аутентифицированных admin/moderator (см. MoreScreen).
export const AdminPanelButton = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={() => router.push('/admin')}
      style={[styles.adminButton, { backgroundColor: currentTheme.primary }]}
    >
      <Ionicons size={22} color={COLORS.white} name='shield-outline' />
      <Text style={[styles.adminButtonLabel, { color: COLORS.white }]}>В админ панель</Text>
    </TouchableItem>
  )
}
