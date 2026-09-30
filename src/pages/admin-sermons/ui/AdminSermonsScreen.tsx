import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { COLORS, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminSermons } from '../lib/useAdminSermons'
import { AdminSermonRow } from './AdminSermonRow'
import { AdminSermonsHeader } from './AdminSermonsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/sermons/create'
const LOAD_MORE_LABEL = 'Загрузить ещё'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить проповеди'
const EMPTY_MESSAGE = 'Проповедей пока нет'

export const AdminSermonsScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const [tabBarHeight] = useAtom(tabBarHeightAtom)
  const {
    hasMore,
    isError,
    isLoading,
    isLoadingMore,
    loadMore,
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

  if (isLoading)
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.centered, { backgroundColor: currentTheme.background }]}
      >
        <ActivityIndicator size='large' color={COLORS.primary} />
      </SafeAreaView>
    )

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <FlatList
        data={sermons}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <AdminSermonRow item={item} onPress={() => openSermon(item)} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low },
        ]}
        ListEmptyComponent={
          isError ? (
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
          hasMore ? (
            <TouchableItem
              onPress={() => void loadMore()}
              style={[styles.loadMore, { backgroundColor: currentTheme.surface }]}
            >
              {isLoadingMore ? (
                <ActivityIndicator color={currentTheme.primary} />
              ) : (
                <Text style={[styles.loadMoreText, { color: currentTheme.primary }]}>
                  {LOAD_MORE_LABEL}
                </Text>
              )}
            </TouchableItem>
          ) : null
        }
      />
    </SafeAreaView>
  )
}
