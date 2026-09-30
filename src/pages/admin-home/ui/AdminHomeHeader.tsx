import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

export const AdminHomeHeader = ({ user }: { user: APITypes.UserResponse | null }) => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <View style={styles.headerTexts}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          Интерфейс администратора
        </Text>
        {user ? (
          <Text style={[styles.headerUser, { color: currentTheme.textMuted }]}>{user.name}</Text>
        ) : null}
      </View>
      <IconButton
        accessibilityLabel='Вернуться в приложение'
        onPress={() => {
          router.replace('/listen')
        }}
        Icon={<Ionicons size={24} name='arrow-back' color={currentTheme.text} />}
      />
    </View>
  )
}
