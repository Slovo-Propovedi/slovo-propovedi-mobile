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
const GRANTED_LABEL = 'Включён'
const DENIED_LABEL = 'Исключён'
const CURRENT_PREFIX = 'Сейчас: '

// Строка пользователя в блоке исключений фича-флага: имя/email, текущее значение
// (если пользователь есть в списке существующих исключений) и три действия —
// включить (grant), выключить (deny) и сбросить (clear) исключение.
export const OverrideUserRow = ({
  currentValue,
  item,
  onClear,
  onDeny,
  onGrant,
}: {
  currentValue: APITypes.FeatureFlagOverrideValue | null
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
        {currentValue ? (
          <Text numberOfLines={1} style={[styles.currentValue, { color: currentTheme.text }]}>
            {`${CURRENT_PREFIX}${currentValue === 'grant' ? GRANTED_LABEL : DENIED_LABEL}`}
          </Text>
        ) : null}
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
