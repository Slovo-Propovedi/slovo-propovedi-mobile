import { Text, View } from 'react-native'
import { ROLE_LABELS } from 'entities/auth'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const buildStats = (user: APITypes.UserResponse) => [
  { label: 'Имя', value: user.name },
  { label: 'Роль', value: ROLE_LABELS[user.role] },
  { label: 'Username', value: user.username },
  { label: 'Email', value: user.email },
  { label: 'ID', value: user.id },
]

// Сетка статистики пользователя: имя, роль, логин, email и id.
export const UserStatGrid = ({ user }: { user: APITypes.UserResponse }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.stats}>
      {buildStats(user).map(stat => (
        <View key={stat.label} style={[styles.stat, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.statLabel, { color: currentTheme.textMuted }]}>{stat.label}</Text>
          <Text style={[styles.statValue, { color: currentTheme.text }]}>{stat.value}</Text>
        </View>
      ))}
    </View>
  )
}
