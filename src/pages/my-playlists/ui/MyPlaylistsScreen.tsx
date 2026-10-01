import { useAction, useAtom } from '@reatom/npm-react'
import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  FAVORITES_PLAYLIST,
  loadMyPlaylists,
  loadSectionSettings,
  type LocalPlaylistData,
  type LocalSectionSettings,
  myPlaylistsAtom,
  sectionSettingsAtom,
  updateSectionSettings,
} from 'entities/playlist'
import { EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { sortByLocalOrder } from '../lib/sortByLocalOrder'
import { useMyPlaylistsHeader } from '../lib/useMyPlaylistsHeader'
import { useReorderMyPlaylists } from '../lib/useReorderMyPlaylists'
import { MyPlaylistsDragList } from './MyPlaylistsDragList'
import { MyPlaylistsEditHeader } from './MyPlaylistsEditHeader'
import { MyPlaylistsNormalView } from './MyPlaylistsNormalView'

const FAVORITES_INDEX = 0
const EMPTY_MESSAGE = 'Своих плейлистов пока нет'

export const MyPlaylistsScreen = () => {
  const { currentTheme } = useTheme()
  const router = useRouter()
  const [playlists] = useAtom(myPlaylistsAtom)
  const [settings] = useAtom(sectionSettingsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const loadSettings = useAction(loadSectionSettings)
  const updateSettings = useAction(updateSectionSettings)
  const reorderPlaylists = useReorderMyPlaylists()

  // null — обычный режим; массив id — открытый режим редактирования с локальным
  // порядком (атом не трогается до «Сохранить»).
  const [localOrderIds, setLocalOrderIds] = useState<null | string[]>(null)

  useEffect(() => {
    void loadPlaylists()
    void loadSettings()
  }, [loadPlaylists, loadSettings])

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
    isEditing,
    onSave: handleSave,
    onToggleEdit: handleToggleEdit,
  })

  // Уход с экрана сбрасывает незакоммиченный локальный порядок.
  useFocusEffect(useCallback(() => () => setLocalOrderIds(null), []))

  const onPressPlaylist = (playlist: LocalPlaylistData) =>
    router.push({ params: { playlist: playlist.id }, pathname: '/listen/playlist' })

  // В режиме редактирования тап по «Избранным» — no-op: навигация ушла бы с
  // экрана, а blur отбросил бы незакоммиченный локальный порядок.
  const onPressFavorites = () => {
    if (isEditing || !favorites) return
    onPressPlaylist(favorites)
  }

  const handleAppearanceChange = (patch: Partial<LocalSectionSettings>) =>
    void updateSettings(patch)

  const orderedRest = isEditing ? sortByLocalOrder(restPlaylists, localOrderIds) : restPlaylists

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Stack.Screen options={headerOptions} />
      {isEditing ? (
        <MyPlaylistsDragList
          isDraggingEnabled
          items={orderedRest}
          onDragEnd={setLocalOrderIds}
          onPressItem={onPressPlaylist}
          listEmpty={<EmptyState message={EMPTY_MESSAGE} />}
          listHeader={
            favorites ? (
              <MyPlaylistsEditHeader
                settings={settings}
                favorites={favorites}
                onPressFavorites={onPressFavorites}
                onAppearanceChange={handleAppearanceChange}
              />
            ) : undefined
          }
        />
      ) : (
        <MyPlaylistsNormalView
          favorites={favorites}
          orderedRest={orderedRest}
          onPressPlaylist={onPressPlaylist}
          onPressFavorites={onPressFavorites}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
