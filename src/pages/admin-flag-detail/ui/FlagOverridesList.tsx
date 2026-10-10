import { useMemo } from 'react'
import { FlatList, Text } from 'react-native'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
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
// пользователей и список строк с действиями grant/deny/clear.
export const FlagOverridesList = ({
  flag,
  onClearOverride,
  onSetOverride,
  overridesState,
  usersState,
}: {
  flag: APITypes.FeatureFlag
  onClearOverride: (userId: string) => void
  onSetOverride: (userId: string, value: APITypes.SetFeatureFlagOverrideRequestValue) => void
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
      renderItem={({ item }) => (
        <OverrideUserRow
          item={item}
          onClear={() => onClearOverride(item.id)}
          onDeny={() => onSetOverride(item.id, 'deny')}
          onGrant={() => onSetOverride(item.id, 'grant')}
          currentValue={overrideValueByUserId.get(item.id) ?? null}
        />
      )}
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
