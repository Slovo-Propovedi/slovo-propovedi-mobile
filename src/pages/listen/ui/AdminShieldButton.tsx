import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'

const ICON_SIZE = 22

// Компактная кнопка входа в интерфейс администратора в шапке таба «Слушать».
// Рендерится только для аутентифицированных admin/moderator (см. ListenScreen).
export const AdminShieldButton = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <IconButton
      hitSlop={INDENTS.low}
      accessibilityLabel='Админка'
      onPress={() => router.push('/admin')}
      Icon={<Ionicons size={ICON_SIZE} name='shield-outline' color={currentTheme.primary} />}
    />
  )
}
