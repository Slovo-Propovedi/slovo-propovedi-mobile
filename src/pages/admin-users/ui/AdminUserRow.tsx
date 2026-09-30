import { Text, View } from 'react-native'
import { ROLE_LABELS } from 'entities/auth'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Карточка пользователя в списке админки: аватар-инициал, имя, email и бейджи
// роли и логина.
export const AdminUserRow = ({
  item,
  onPress,
}: {
  item: APITypes.UserResponse
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()
  const initial = item.name.slice(0, 1).toUpperCase()

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.row, { backgroundColor: currentTheme.surface }]}
    >
      <View style={[styles.avatar, { backgroundColor: currentTheme.primary }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: currentTheme.text }]}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: currentTheme.textMuted }]}>
          {item.email}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: currentTheme.primary }]}>
            <Text style={[styles.badgeText, { color: currentTheme.text }]}>
              {ROLE_LABELS[item.role]}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: currentTheme.skeleton }]}>
            <Text style={[styles.badgeText, { color: currentTheme.text }]}>{item.username}</Text>
          </View>
        </View>
      </View>
    </TouchableItem>
  )
}
