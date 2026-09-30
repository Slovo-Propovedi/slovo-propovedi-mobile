import Ionicons from '@expo/vector-icons/Ionicons'
import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { Text } from 'react-native'
import { signOut } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

export const AdminQuickActions = () => {
  const router = useRouter()
  const signOutAction = useAction(signOut)
  const { currentTheme } = useTheme()

  const handleSignOut = async () => {
    await signOutAction()
    router.replace('/listen')
  }

  return (
    <>
      <TouchableItem
        onPress={() => {
          router.push('/admin/upload')
        }}
        style={[styles.actionRow, { backgroundColor: currentTheme.surface }]}
      >
        <Ionicons size={22} name='cloud-upload-outline' color={currentTheme.primary} />
        <Text style={[styles.actionLabel, { color: currentTheme.text }]}>Загрузить проповедь</Text>
        <Ionicons size={20} name='chevron-forward' color={currentTheme.textMuted} />
      </TouchableItem>
      <TouchableItem
        onPress={() => {
          void handleSignOut()
        }}
        style={[styles.actionRow, { backgroundColor: currentTheme.surface }]}
      >
        <Ionicons size={22} name='log-out-outline' color={currentTheme.textMuted} />
        <Text style={[styles.actionLabel, { color: currentTheme.textMuted }]}>
          Выйти из аккаунта
        </Text>
      </TouchableItem>
    </>
  )
}
