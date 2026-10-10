import { useMemo } from 'react'
import { FlatList, Text } from 'react-native'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { resolveEffectiveEnabled } from '../lib/overrideAction'
import { type FlagOverridesState } from '../lib/useFlagOverrides'
import { type OverrideUsersState } from '../lib/useOverrideUsers'
import { FlagDetailHeader } from './FlagDetailHeader'
import { OverrideUserRow } from './OverrideUserRow'
import { styles } from './styles'

const EMPTY_MESSAGE = 'Пользователей пока нет'
const NOT_FOUND_MESSAGE = 'Ничего не найдено'
const LOAD_USERS_ERROR = 'Не удалось загрузить пользователей'
const LOAD_MORE_FAILED_LABEL = 'Повторить загрузку'
const SKELETON_ROWS = 4

const OverrideSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <OverrideUserRow.Skeleton key={index} />
    ))}
  </>
)

// Тело детали фича-флага: карточка флага, существующие исключения, поиск
// пользователей и список строк с тумблером эффективного состояния.
export const FlagOverridesList = ({
  flag,
  onApplyOverride,
  overridesState,
  usersState,
}: {
  flag: APITypes.FeatureFlag
  onApplyOverride: (userId: string, desiredEnabled: boolean) => void
  overridesState: FlagOverridesState
  usersState: OverrideUsersState
}) => {
  const { currentTheme } = useTheme()
  const {
    isError,
    isLoading,
    isLoadingMore,
    loadMore,
    loadMoreFailed,
    onSearchChange,
    search,
    userById,
    users,
  } = usersState

  const overrideValueByUserId = useMemo(
    () => new Map(overridesState.overrides.map(item => [item.userId, item.value])),
    [overridesState.overrides],
  )

  const emptyMessage = search.trim() !== '' ? NOT_FOUND_MESSAGE : EMPTY_MESSAGE

  return (
    <FlatList
      onEndReachedThreshold={0.5}
      data={isLoading ? [] : users}
      keyExtractor={item => item.id}
      onEndReached={() => void loadMore()}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <FlagDetailHeader
          flag={flag}
          search={search}
          userById={userById}
          onSearchChange={onSearchChange}
          overridesState={overridesState}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <OverrideSkeletonList />
        ) : isError ? (
          <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_USERS_ERROR}</Text>
        ) : (
          <EmptyState message={emptyMessage} />
        )
      }
      renderItem={({ item }) => {
        const overrideValue = overrideValueByUserId.get(item.id) ?? null

        return (
          <OverrideUserRow
            item={item}
            hasOverride={overrideValue !== null}
            onToggle={desiredEnabled => onApplyOverride(item.id, desiredEnabled)}
            effectiveEnabled={resolveEffectiveEnabled(overrideValue, flag.enabled)}
          />
        )
      }}
      ListFooterComponent={
        isLoadingMore ? (
          <OverrideUserRow.Skeleton />
        ) : loadMoreFailed ? (
          <TouchableItem
            onPress={() => void loadMore()}
            style={[styles.retry, { backgroundColor: currentTheme.surface }]}
          >
            <Text style={[styles.retryText, { color: currentTheme.primary }]}>
              {LOAD_MORE_FAILED_LABEL}
            </Text>
          </TouchableItem>
        ) : null
      }
    />
  )
}
