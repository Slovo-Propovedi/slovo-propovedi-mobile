import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { AdminUserRowSkeleton } from 'shared/ui'
import { CheckboxField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const ENABLED_LABEL = 'Включено'
const DISABLED_LABEL = 'Выключено'
const OVERRIDE_HINT = 'исключение'

const buildStateLabel = (effectiveEnabled: boolean, hasOverride: boolean) => {
  const state = effectiveEnabled ? ENABLED_LABEL : DISABLED_LABEL

  return hasOverride ? `${state} · ${OVERRIDE_HINT}` : state
}

// Строка пользователя в блоке исключений: имя/email и один тумблер эффективного
// состояния. ON — флаг включён для пользователя (глобально или grant-исключением),
// OFF — выключен (глобально или deny-исключением). Подпись рядом показывает
// состояние и помечает наличие явного исключения («исключение»).
export const OverrideUserRow = ({
  effectiveEnabled,
  hasOverride,
  item,
  onToggle,
}: {
  effectiveEnabled: boolean
  hasOverride: boolean
  item: APITypes.UserResponse
  onToggle: (desiredEnabled: boolean) => void
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
      <CheckboxField
        onChange={onToggle}
        value={effectiveEnabled}
        label={buildStateLabel(effectiveEnabled, hasOverride)}
      />
    </View>
  )
}

// Скелетон строки заимствуется у строки пользователя админки и прикреплён к
// `OverrideUserRow.Skeleton` — потребитель не импортирует плейсхолдер напрямую.
OverrideUserRow.Skeleton = AdminUserRowSkeleton
