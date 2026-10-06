import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

const ICON_SIZE = 22

// Компактная кнопка входа в интерфейс администратора в шапке таба «Ещё».
// Рендерится только для аутентифицированных admin/moderator (см. MoreScreen).
export const AdminPanelButton = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <IconButton
      accessibilityLabel='В админ панель'
      onPress={() => router.push('/admin')}
      Icon={<Ionicons size={ICON_SIZE} name='shield-outline' color={currentTheme.primary} />}
    />
  )
}
