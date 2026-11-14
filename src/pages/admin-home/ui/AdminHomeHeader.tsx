import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { RefreshButton } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { AdminHomeUserMenu } from './AdminHomeUserMenu'
import { styles } from './styles'

export const AdminHomeHeader = ({ user }: { user: APITypes.UserResponse | null }) => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <IconButton
        accessibilityLabel='Вернуться в приложение'
        onPress={() => {
          router.replace('/listen')
        }}
        Icon={<Ionicons size={24} name='arrow-back' color={currentTheme.text} />}
      />
      <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
        Интерфейс администратора
      </Text>
      <AdminHomeUserMenu user={user} />
      <RefreshButton />
    </View>
  )
}
