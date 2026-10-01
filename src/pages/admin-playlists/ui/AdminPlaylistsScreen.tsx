import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { FlatList, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminPlaylists } from '../lib/useAdminPlaylists'
import { AdminPlaylistRow } from './AdminPlaylistRow'
import { AdminPlaylistsHeader } from './AdminPlaylistsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/playlists/create'
const LOAD_MORE_FAILED_LABEL = 'Повторить загрузку'
const SKELETON_ROWS = 6

const PlaylistSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminPlaylistRow.Skeleton key={index} />
    ))}
  </>
)

export const AdminPlaylistsScreen = () => {
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
    playlists,
    search,
    sort,
  } = useAdminPlaylists()

  const openPlaylist = (playlist: APITypes.PlaylistEntity) => {
    router.push({ params: { id: playlist.id }, pathname: '/admin/playlists/[id]' })
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <FlatList
        onEndReachedThreshold={0.5}
        keyExtractor={item => item.id}
        data={isLoading ? [] : playlists}
        onEndReached={() => void loadMore()}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + INDENTS.low }]}
        renderItem={({ item }) => (
          <AdminPlaylistRow item={item} onPress={() => openPlaylist(item)} />
        )}
        ListEmptyComponent={
          isLoading ? (
            <PlaylistSkeletonList />
          ) : isError ? (
            <Text style={[styles.error, { color: currentTheme.textMuted }]}>
              Не удалось загрузить плейлисты
            </Text>
          ) : (
            <EmptyState message='Плейлистов пока нет' />
          )
        }
        ListHeaderComponent={
          <AdminPlaylistsHeader
            sort={sort}
            order={order}
            search={search}
            count={playlists.length}
            onSortChange={onSortChange}
            onOrderChange={onOrderChange}
            onSearchChange={onSearchChange}
            onCreate={() => router.push(CREATE_ROUTE)}
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <AdminPlaylistRow.Skeleton />
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
