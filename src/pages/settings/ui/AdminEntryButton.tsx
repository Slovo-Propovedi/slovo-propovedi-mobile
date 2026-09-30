import Ionicons from '@expo/vector-icons/Ionicons'
import { type ColorValue } from 'react-native'
import { useAdminEntry } from 'entities/auth'
import { IconButton } from 'shared/ui/icon-button'

// Кнопка шапки «Настроек»: вход в интерфейс администратора.
export const AdminEntryButton = ({ tintColor }: { tintColor?: ColorValue }) => {
  const { openAdminInterface } = useAdminEntry()

  return (
    <IconButton
      accessibilityLabel='Перейти в интерфейс администратора'
      onPress={() => {
        void openAdminInterface()
      }}
      Icon={<Ionicons size={24} color={tintColor} name='shield-outline' />}
    />
  )
}
