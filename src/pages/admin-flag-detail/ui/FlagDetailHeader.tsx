import { Text, TextInput, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const ENABLED_LABEL = 'Включён'
const DISABLED_LABEL = 'Выключен'
const SECTION_TITLE = 'Исключения'
const HINT =
  'Включите или выключите флаг для конкретного пользователя. Сервер не отдаёт список существующих исключений — действие применяется сразу.'
const SEARCH_PLACEHOLDER = 'Имя, email или логин…'
const SEARCH_LABEL = 'Поиск пользователей'

// Шапка тела детали фича-флага: карточка с названием/ключом и бейджем состояния,
// заголовок блока исключений, подсказка и поиск пользователей.
export const FlagDetailHeader = ({
  flag,
  onSearchChange,
  search,
}: {
  flag: APITypes.FeatureFlag
  onSearchChange: (search: string) => void
  search: string
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
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{SECTION_TITLE}</Text>
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
