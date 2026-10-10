import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { formatRelativeDate } from 'shared/lib/format'
import { AdminUserRowSkeleton } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const GRANTED_LABEL = 'Включён'
const DENIED_LABEL = 'Исключён'

// Строка существующего пер-пользовательского исключения фича-флага: пользователь,
// значение (Включён/Исключён) и дата создания относительно текущего момента.
export const OverrideRow = ({
  override,
  user,
}: {
  override: APITypes.FeatureFlagOverride
  user: APITypes.UserResponse | undefined
}) => {
  const { currentTheme } = useTheme()
  const isGranted = override.value === 'grant'

  return (
    <View style={[styles.overrideRow, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.userBody}>
        <Text numberOfLines={1} style={[styles.userName, { color: currentTheme.text }]}>
          {user?.name ?? override.userId}
        </Text>
        {user ? (
          <Text numberOfLines={1} style={[styles.userMeta, { color: currentTheme.textMuted }]}>
            {user.email}
          </Text>
        ) : null}
        <Text numberOfLines={1} style={[styles.userMeta, { color: currentTheme.textMuted }]}>
          {formatRelativeDate(Date.parse(override.createdAt))}
        </Text>
      </View>
      <View
        style={[
          styles.badge,
          { backgroundColor: isGranted ? currentTheme.primary : currentTheme.skeleton },
        ]}
      >
        <Text style={[styles.badgeText, { color: currentTheme.text }]}>
          {isGranted ? GRANTED_LABEL : DENIED_LABEL}
        </Text>
      </View>
    </View>
  )
}

// Скелетон строки заимствуется у строки пользователя админки и прикреплён к
// `OverrideRow.Skeleton` — потребитель не импортирует плейсхолдер напрямую.
OverrideRow.Skeleton = AdminUserRowSkeleton
