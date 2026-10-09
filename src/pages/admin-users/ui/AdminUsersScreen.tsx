import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { FlatList, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRequireAdminRole } from 'entities/auth'
import { createRefreshControl, EmptyState, PullToRefresh } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminUsers } from '../lib/useAdminUsers'
import { AdminUserRow } from './AdminUserRow'
import { AdminUsersHeader } from './AdminUsersHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/users/create'
const EMPTY_MESSAGE = 'Пользователей пока нет'
const NOT_FOUND_MESSAGE = 'Ничего не найдено'
const LOAD_ERROR = 'Не удалось загрузить пользователей'
const LOAD_MORE_FAILED_LABEL = 'Повторить загрузку'
const SKELETON_ROWS = 6

const UserSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminUserRow.Skeleton key={index} />
    ))}
  </>
)

// Список пользователей админки (только для роли admin): поиск по загруженным
// страницам, автодозагрузка при достижении конца и переход к детали/созданию.
export const AdminUsersScreen = () => {
  useRequireAdminRole()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const {
    isError,
    isLoading,
    isLoadingMore,
    isRefreshing,
    loadMore,
    loadMoreFailed,
    onSearchChange,
    refresh,
    search,
    users,
  } = useAdminUsers()

  const openUser = (id: string) => {
    router.push({ params: { id }, pathname: '/admin/users/[id]' })
  }

  const emptyMessage = search.trim() !== '' ? NOT_FOUND_MESSAGE : EMPTY_MESSAGE

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.background, paddingTop: insets.top },
      ]}
    >
      <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
        <FlatList
          onEndReachedThreshold={0.5}
          data={isLoading ? [] : users}
          keyExtractor={item => item.id}
          onEndReached={() => void loadMore()}
          refreshControl={createRefreshControl(isRefreshing, refresh, currentTheme.primary)}
          renderItem={({ item }) => <AdminUserRow item={item} onPress={() => openUser(item.id)} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + INDENTS.low },
          ]}
          ListEmptyComponent={
            isLoading ? (
              <UserSkeletonList />
            ) : isError ? (
              <Text style={[styles.error, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>
            ) : (
              <EmptyState message={emptyMessage} />
            )
          }
          ListFooterComponent={
            isLoadingMore ? (
              <AdminUserRow.Skeleton />
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
          ListHeaderComponent={
            <View style={styles.header}>
              <AdminUsersHeader onCreate={() => router.push(CREATE_ROUTE)} />
              <TextInput
                value={search}
                onChangeText={onSearchChange}
                placeholder='Имя, email или логин…'
                accessibilityLabel='Поиск пользователей'
                placeholderTextColor={currentTheme.placeholder}
                style={[
                  styles.input,
                  { borderColor: currentTheme.textMuted, color: currentTheme.text },
                ]}
              />
            </View>
          }
        />
      </PullToRefresh>
    </View>
  )
}
