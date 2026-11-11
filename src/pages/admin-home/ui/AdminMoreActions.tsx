import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { isAdminUser } from 'entities/auth'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

const MORE_ACTIONS = [
  { adminOnly: false, icon: 'images-outline', label: 'Медиа', route: '/admin/media' },
  { adminOnly: true, icon: 'flag-outline', label: 'Флаги', route: '/admin/flags' },
  {
    adminOnly: true,
    icon: 'server-outline',
    label: 'Источники импорта',
    route: '/admin/invidious',
  },
  { adminOnly: true, icon: 'people-outline', label: 'Пользователи', route: '/admin/users' },
] as const

export const AdminMoreActions = ({ user }: { user: APITypes.UserResponse | null }) => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const visibleRows = MORE_ACTIONS.filter(action => !action.adminOnly || isAdminUser(user))

  if (visibleRows.length === 0) return null

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: currentTheme.textMuted }]}>Дополнительно</Text>
      {visibleRows.map(action => (
        <TouchableItem
          key={action.route}
          onPress={() => {
            router.push(action.route)
          }}
          style={[styles.actionRow, { backgroundColor: currentTheme.surface }]}
        >
          <Ionicons size={22} name={action.icon} color={currentTheme.primary} />
          <Text style={[styles.actionLabel, { color: currentTheme.text }]}>{action.label}</Text>
          <Ionicons size={20} name='chevron-forward' color={currentTheme.textMuted} />
        </TouchableItem>
      ))}
    </View>
  )
}
