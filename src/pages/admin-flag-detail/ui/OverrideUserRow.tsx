import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { AdminUserRowSkeleton } from 'shared/ui'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme } from 'shared/ui/theme'
import { COLORS } from 'shared/ui/theme/colors'
import { styles } from './styles'

const GRANT_LABEL = 'Включить'
const DENY_LABEL = 'Выключить'
const CLEAR_LABEL = 'Сбросить'

// Строка пользователя в блоке исключений фича-флага: имя/email и три действия —
// включить (grant), выключить (deny) и сбросить (clear) пер-пользовательское
// исключение. Текущее исключение сервер не отдаёт, поэтому строка показывает
// только действия, а результат подтверждается тостом.
export const OverrideUserRow = ({
  item,
  onClear,
  onDeny,
  onGrant,
}: {
  item: APITypes.UserResponse
  onClear: () => void
  onDeny: () => void
  onGrant: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.userRow, { backgroundColor: currentTheme.surface }]}>
      <View style={styles.userBody}>
        <Text numberOfLines={1} style={[styles.userName, { color: currentTheme.text }]}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={[styles.userMeta, { color: currentTheme.textMuted }]}>
          {item.email}
        </Text>
      </View>
      <View style={styles.actions}>
        <PressableButton
          onPress={onGrant}
          accessibilityLabel={`${GRANT_LABEL}: ${item.name}`}
          style={[styles.actionButton, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={[styles.actionText, { color: COLORS.white }]}>{GRANT_LABEL}</Text>
        </PressableButton>
        <PressableButton
          onPress={onDeny}
          accessibilityLabel={`${DENY_LABEL}: ${item.name}`}
          style={[styles.actionButton, { backgroundColor: currentTheme.skeleton }]}
        >
          <Text style={[styles.actionText, { color: currentTheme.text }]}>{DENY_LABEL}</Text>
        </PressableButton>
        <PressableButton
          onPress={onClear}
          accessibilityLabel={`${CLEAR_LABEL}: ${item.name}`}
          style={[styles.actionButton, { borderColor: currentTheme.textMuted, borderWidth: 1 }]}
        >
          <Text style={[styles.actionText, { color: currentTheme.textMuted }]}>{CLEAR_LABEL}</Text>
        </PressableButton>
      </View>
    </View>
  )
}

// Скелетон строки заимствуется у строки пользователя админки и прикреплён к
// `OverrideUserRow.Skeleton` — потребитель не импортирует плейсхолдер напрямую.
OverrideUserRow.Skeleton = AdminUserRowSkeleton
