import Ionicons from '@expo/vector-icons/Ionicons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { Text } from 'react-native'
import { authUserAtom, isAdminUser, signOut } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

export const AdminQuickActions = () => {
  const router = useRouter()
  const signOutAction = useAction(signOut)
  const [user] = useAtom(authUserAtom)
  const { currentTheme } = useTheme()

  const handleSignOut = async () => {
    await signOutAction()
    router.replace('/listen')
  }

  return (
    <>
      <TouchableItem
        style={[styles.actionRow, { backgroundColor: currentTheme.surface }]}
        onPress={() => {
          router.push('/admin/sermons/create')
        }}
      >
        <Ionicons size={22} name='cloud-upload-outline' color={currentTheme.primary} />
        <Text style={[styles.actionLabel, { color: currentTheme.text }]}>Загрузить проповедь</Text>
        <Ionicons size={20} name='chevron-forward' color={currentTheme.textMuted} />
      </TouchableItem>
      {isAdminUser(user) ? (
        <TouchableItem
          style={[styles.actionRow, { backgroundColor: currentTheme.surface }]}
          onPress={() => {
            router.push('/admin/invidious')
          }}
        >
          <Ionicons size={22} name='server-outline' color={currentTheme.primary} />
          <Text style={[styles.actionLabel, { color: currentTheme.text }]}>Источники импорта</Text>
          <Ionicons size={20} name='chevron-forward' color={currentTheme.textMuted} />
        </TouchableItem>
      ) : null}
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
