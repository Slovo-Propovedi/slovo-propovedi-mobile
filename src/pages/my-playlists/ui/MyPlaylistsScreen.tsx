import { useAction, useAtom } from '@reatom/npm-react'
import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  FAVORITES_PLAYLIST,
  loadMyPlaylists,
  type LocalPlaylistData,
  myPlaylistsAtom,
} from 'entities/playlist'
import { EmptyState } from 'shared/ui'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { sortByLocalOrder } from '../lib/sortByLocalOrder'
import { useMyPlaylistsHeader } from '../lib/useMyPlaylistsHeader'
import { useReorderMyPlaylists } from '../lib/useReorderMyPlaylists'
import { MyPlaylistsDragList } from './MyPlaylistsDragList'
import { MyPlaylistsFavoritesRow } from './MyPlaylistsFavoritesRow'

const FAVORITES_INDEX = 0
const EMPTY_MESSAGE = 'Своих плейлистов пока нет'

export const MyPlaylistsScreen = () => {
  const { currentTheme } = useTheme()
  const router = useRouter()
  const [playlists] = useAtom(myPlaylistsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const reorderPlaylists = useReorderMyPlaylists()

  // null — обычный режим; массив id — открытый режим редактирования с локальным
  // порядком (атом не трогается до «Сохранить»).
  const [localOrderIds, setLocalOrderIds] = useState<null | string[]>(null)

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  const favorites = playlists[FAVORITES_INDEX]
  const restPlaylists = playlists.slice(FAVORITES_INDEX + 1)
  const isEditing = localOrderIds !== null

  const handleToggleEdit = useCallback(() => {
    setLocalOrderIds(current => (current ? null : restPlaylists.map(playlist => playlist.id)))
  }, [restPlaylists])

  const handleSave = useCallback(() => {
    if (!localOrderIds) return
    reorderPlaylists([FAVORITES_PLAYLIST.id, ...localOrderIds])
    setLocalOrderIds(null)
  }, [localOrderIds, reorderPlaylists])

  const headerOptions = useMyPlaylistsHeader({
    isEditable: restPlaylists.length > 0,
    isEditing,
    onSave: handleSave,
    onToggleEdit: handleToggleEdit,
  })

  // Уход с экрана сбрасывает незакоммиченный локальный порядок.
  useFocusEffect(useCallback(() => () => setLocalOrderIds(null), []))

  const onPressPlaylist = (playlist: LocalPlaylistData) =>
    router.push({ params: { playlist: playlist.id }, pathname: '/listen/playlist' })

  const orderedRest = isEditing ? sortByLocalOrder(restPlaylists, localOrderIds) : restPlaylists

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Stack.Screen options={headerOptions} />
      {favorites ? (
        <View style={styles.favorites}>
          <MyPlaylistsFavoritesRow
            playlist={favorites}
            onPress={() => onPressPlaylist(favorites)}
          />
        </View>
      ) : null}
      <View style={styles.list}>
        {orderedRest.length === 0 ? (
          <EmptyState message={EMPTY_MESSAGE} />
        ) : (
          <MyPlaylistsDragList
            items={orderedRest}
            onDragEnd={setLocalOrderIds}
            isDraggingEnabled={isEditing}
            onPressItem={onPressPlaylist}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  favorites: { paddingHorizontal: INDENTS.medium, paddingVertical: INDENTS.middle },
  list: { flex: 1 },
})
