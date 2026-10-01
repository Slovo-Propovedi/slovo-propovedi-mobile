import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { FlatList, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminSermons } from '../lib/useAdminSermons'
import { AdminSermonRow } from './AdminSermonRow'
import { AdminSermonsHeader } from './AdminSermonsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/sermons/create'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповеди'
const LOAD_MORE_FAILED_LABEL = 'Повторить загрузку'
const EMPTY_MESSAGE = 'Проповедей пока нет'
const SKELETON_ROWS = 6
const LIST_TEST_ID = 'admin-sermons-list'

const SermonSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminSermonRow.Skeleton key={index} />
    ))}
  </>
)

export const AdminSermonsScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const {
    isError,
    isLoading,
    isLoadingMore,
    loadMore,
    loadMoreFailed,
    onOrderChange,
    onSearchChange,
    onSortChange,
    order,
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
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <FlatList
        testID={LIST_TEST_ID}
        onEndReachedThreshold={0.5}
        keyExtractor={item => item.id}
        data={isLoading ? [] : sermons}
        onEndReached={() => void loadMore()}
        renderItem={({ item }) => <AdminSermonRow item={item} onPress={() => openSermon(item)} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + INDENTS.low }]}
        ListEmptyComponent={
          isLoading ? (
            <SermonSkeletonList />
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
            count={sermons.length}
            onOrderChange={onOrderChange}
            onSortChange={handleSortChange}
            onSearchChange={onSearchChange}
            onCreate={() => router.push(CREATE_ROUTE)}
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <AdminSermonRow.Skeleton />
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
    </SafeAreaView>
  )
}
