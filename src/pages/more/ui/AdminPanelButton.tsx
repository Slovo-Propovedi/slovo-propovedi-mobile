import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from 'react-native'
import { useAdminEntry } from 'entities/auth'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Заметная кнопка входа в интерфейс администратора на табе «Еще».
export const AdminPanelButton = () => {
  const { openAdminInterface } = useAdminEntry()
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={() => {
        void openAdminInterface()
      }}
      style={[styles.adminButton, { backgroundColor: currentTheme.primary }]}
    >
      <Ionicons size={22} color={COLORS.white} name='shield-outline' />
      <Text style={[styles.adminButtonLabel, { color: COLORS.white }]}>В админ панель</Text>
    </TouchableItem>
  )
}
