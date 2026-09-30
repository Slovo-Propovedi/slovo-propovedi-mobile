import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type APITypes } from 'shared/api'
import { EmptyState } from 'shared/ui'
import { tabBarHeightAtom } from 'shared/ui/layout'
import { COLORS, INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminPlaylists } from '../lib/useAdminPlaylists'
import { AdminPlaylistRow } from './AdminPlaylistRow'
import { AdminPlaylistsHeader } from './AdminPlaylistsHeader'
import { styles } from './styles'

const CREATE_ROUTE = '/admin/playlists/create'
const LOAD_MORE_LABEL = 'Загрузить ещё'

export const AdminPlaylistsScreen = () => {
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
    playlists,
    search,
    sort,
  } = useAdminPlaylists()

  const openPlaylist = (playlist: APITypes.PlaylistEntity) => {
    router.push({ params: { id: playlist.id }, pathname: '/admin/playlists/[id]' })
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
        data={playlists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AdminPlaylistRow item={item} onPress={() => openPlaylist(item)} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low },
        ]}
        ListEmptyComponent={
          isError ? (
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
