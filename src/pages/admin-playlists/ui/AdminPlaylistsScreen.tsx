import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { FlatList, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { AdminPlaylistRowSkeleton, EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { useAdminPlaylists } from '../lib/useAdminPlaylists'
import { AdminPlaylistRow } from './AdminPlaylistRow'
import { AdminPlaylistsHeader } from './AdminPlaylistsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/playlists/create'
const SKELETON_ROWS = 6

const PlaylistSkeletonList = () => (
  <>
    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <AdminPlaylistRowSkeleton key={index} />
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
        ListFooterComponent={isLoadingMore ? <AdminPlaylistRowSkeleton /> : null}
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
      />
    </SafeAreaView>
  )
}
