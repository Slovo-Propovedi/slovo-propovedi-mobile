import { Text, TextInput, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { type FlagOverridesState } from '../lib/useFlagOverrides'
import { FlagOverridesSection } from './FlagOverridesSection'
import { styles } from './styles'

const ENABLED_LABEL = 'Включён'
const DISABLED_LABEL = 'Выключен'
const HINT =
  'Включите или выключите флаг для конкретного пользователя — действие применяется сразу.'
const SEARCH_PLACEHOLDER = 'Имя, email или логин…'
const SEARCH_LABEL = 'Поиск пользователей'

// Шапка тела детали фича-флага: карточка с названием/ключом и бейджем состояния,
// блок существующих исключений и поиск пользователей для назначения нового.
export const FlagDetailHeader = ({
  flag,
  onSearchChange,
  overridesState,
  search,
  userById,
}: {
  flag: APITypes.FeatureFlag
  onSearchChange: (search: string) => void
  overridesState: FlagOverridesState
  search: string
  userById: Map<string, APITypes.UserResponse>
}) => {
  const { currentTheme } = useTheme()

  return (
    <View>
      <View style={[styles.headerCard, { backgroundColor: currentTheme.surface }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: currentTheme.text }]}>{flag.title}</Text>
            <Text style={[styles.keyText, { color: currentTheme.textMuted }]}>{flag.key}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: flag.enabled ? currentTheme.primary : currentTheme.skeleton },
            ]}
          >
            <Text style={[styles.badgeText, { color: currentTheme.text }]}>
              {flag.enabled ? ENABLED_LABEL : DISABLED_LABEL}
            </Text>
          </View>
        </View>
      </View>
      <FlagOverridesSection userById={userById} overridesState={overridesState} />
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{HINT}</Text>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder={SEARCH_PLACEHOLDER}
        accessibilityLabel={SEARCH_LABEL}
        placeholderTextColor={currentTheme.placeholder}
        style={[
          styles.searchInput,
          { borderColor: currentTheme.textMuted, color: currentTheme.text },
        ]}
      />
    </View>
  )
}
