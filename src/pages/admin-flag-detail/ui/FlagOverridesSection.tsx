import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { type FlagOverridesState } from '../lib/useFlagOverrides'
import { OverrideRow } from './OverrideRow'
import { styles } from './styles'

const SECTION_TITLE = 'Исключения'
const EMPTY_MESSAGE = 'Пока нет исключений'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить исключения'
const SKELETON_ROWS = 3

const OverrideSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <OverrideRow.Skeleton key={index} />
    ))}
  </>
)

// Блок существующих пер-пользовательских исключений флага: список «пользователь →
// значение» с датой создания. Пустой список — валидное состояние (без исключений).
export const FlagOverridesSection = ({
  overridesState,
  userById,
}: {
  overridesState: FlagOverridesState
  userById: Map<string, APITypes.UserResponse>
}) => {
  const { currentTheme } = useTheme()
  const { isError, isLoading, overrides } = overridesState
  const hasOverrides = overrides.length > 0

  const body = isLoading ? (
    <OverrideSkeletonList />
  ) : hasOverrides ? (
    <>
      {isError ? (
        <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_ERROR_MESSAGE}</Text>
      ) : null}
      {overrides.map(override => (
        <OverrideRow
          override={override}
          key={override.userId}
          user={userById.get(override.userId)}
        />
      ))}
    </>
  ) : isError ? (
    <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_ERROR_MESSAGE}</Text>
  ) : (
    <EmptyState message={EMPTY_MESSAGE} />
  )

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{SECTION_TITLE}</Text>
      {body}
    </View>
  )
}
