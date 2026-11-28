import { useRouter } from 'expo-router'
import { FlatList, Text } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import {
  BLUR_TARGET_ROUTES,
  BlurBackdrop,
  createRefreshControl,
  EmptyState,
  PullToRefresh,
  WideTopActions,
} from 'shared/ui'
import { useInsetsPadding, useIsWideLayout, useScreenChromePadding } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { useAdminSermons } from '../lib/useAdminSermons'
import { AdminSermonRow } from './AdminSermonRow'
import { AdminSermonsHeader } from './AdminSermonsHeader'
import { AdminSermonSkeletonList } from './AdminSermonSkeletonList'
import { AdminSermonsRetryFooter } from './AdminSermonsRetryFooter'
import { AdminSermonsTopActions } from './AdminSermonsTopActions'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/sermons/create'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповеди'
const EMPTY_MESSAGE = 'Проповедей пока нет'
const LIST_TEST_ID = 'admin-sermons-list'

export const AdminSermonsScreen = () => {
  const insets = useSafeAreaInsets()
  const insetsPadding = useInsetsPadding({ top: insets.top })
  const isWide = useIsWideLayout()
  const { bottomBarHeight, topChromeScrollInset: scrollInset } = useScreenChromePadding()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const { primary } = currentTheme
  const {
    isError,
    isLoading,
    isLoadingMore,
    isRefreshing,
    loadMore,
    loadMoreFailed,
    onOrderChange,
    onSearchChange,
    onSortChange,
    order,
    refresh,
    search,
    sermons,
    sort,
  } = useAdminSermons()

  const openSermon = (sermon: APITypes.SermonEntity) => {
    router.push({ params: { id: sermon.id }, pathname: '/admin/sermons/[id]' })
  }

  // Бэкенд задаёт направление по умолчанию для каждой сортировки: `date` —
  // по убыванию (порядок загрузки), остальные — по возрастанию. Смена
  // сортировки подтягивает направление к этому умолчанию.
  const handleSortChange = (nextSort: APITypes.SermonControllerFindAllSort) => {
    onSortChange(nextSort)
    onOrderChange(nextSort === 'date' ? 'desc' : 'asc')
  }

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.adminSermons}>
      <Animated.View
        style={[styles.container, { backgroundColor: currentTheme.background }, insetsPadding]}
      >
        <PullToRefresh onRefresh={refresh} refreshing={isRefreshing}>
          <FlatList
            testID={LIST_TEST_ID}
            onEndReachedThreshold={0.5}
            keyExtractor={item => item.id}
            data={isLoading ? [] : sermons}
            onEndReached={() => void loadMore()}
            refreshControl={createRefreshControl(isRefreshing, refresh, primary, scrollInset)}
            renderItem={({ item }) => (
              <AdminSermonRow item={item} onPress={() => openSermon(item)} />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: bottomBarHeight + INDENTS.low, paddingTop: scrollInset },
            ]}
            ListFooterComponent={
              <AdminSermonsRetryFooter
                isLoadingMore={isLoadingMore}
                loadMoreFailed={loadMoreFailed}
                onRetry={() => void loadMore()}
              />
            }
            ListEmptyComponent={
              isLoading ? (
                <AdminSermonSkeletonList />
              ) : isError ? (
                <Text style={[styles.error, { color: currentTheme.textMuted }]}>
                  {LOAD_ERROR_MESSAGE}
                </Text>
              ) : (
                <EmptyState message={EMPTY_MESSAGE} />
              )
            }
            ListHeaderComponent={
              <AdminSermonsHeader
                sort={sort}
                order={order}
                search={search}
                showActions={!isWide}
                count={sermons.length}
                onOrderChange={onOrderChange}
                onSortChange={handleSortChange}
                onSearchChange={onSearchChange}
                onCreate={() => router.push(CREATE_ROUTE)}
              />
            }
          />
          <WideTopActions>
            <AdminSermonsTopActions onCreate={() => router.push(CREATE_ROUTE)} />
          </WideTopActions>
        </PullToRefresh>
      </Animated.View>
    </BlurBackdrop>
  )
}
