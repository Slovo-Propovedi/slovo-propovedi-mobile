import { useAction, useAtom } from '@reatom/npm-react'
import { Stack, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  CreateLocalPlaylistModal,
  LocalPlaylistDeleteDialog,
  useLocalPlaylistDelete,
} from 'features/local-playlist-form'
import {
  FAVORITES_PLAYLIST,
  loadMyPlaylists,
  loadSectionSettings,
  type LocalSectionSettings,
  myPlaylistsAtom,
  sectionSettingsAtom,
  updateSectionSettings,
} from 'entities/playlist'
import { BLUR_TARGET_ROUTES, BlurBackdrop } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { sortByLocalOrder } from '../lib/sortByLocalOrder'
import { useMyPlaylistsHeader } from '../lib/useMyPlaylistsHeader'
import { useMyPlaylistsNavigation } from '../lib/useMyPlaylistsNavigation'
import { useReorderMyPlaylists } from '../lib/useReorderMyPlaylists'
import { MyPlaylistsEditView } from './MyPlaylistsEditView'
import { MyPlaylistsNormalView } from './MyPlaylistsNormalView'

const FAVORITES_INDEX = 0

export const MyPlaylistsScreen = () => {
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const [settings] = useAtom(sectionSettingsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const loadSettings = useAction(loadSectionSettings)
  const updateSettings = useAction(updateSectionSettings)
  const reorderPlaylists = useReorderMyPlaylists()

  // null — обычный режим; массив id — открытый режим редактирования с локальным
  // порядком (атом не трогается до «Сохранить»).
  const [localOrderIds, setLocalOrderIds] = useState<null | string[]>(null)
  const [isCreateVisible, setCreateVisible] = useState(false)

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

  const { onPressFavorites, onPressPlaylist } = useMyPlaylistsNavigation(isEditing, favorites)

  const handleAppearanceChange = (patch: Partial<LocalSectionSettings>) =>
    void updateSettings(patch)

  // Удалённый плейлист убирается из локальной копии порядка.
  const handleDeleted = useCallback((playlistId: string) => {
    setLocalOrderIds(current => (current ? current.filter(id => id !== playlistId) : current))
  }, [])
  const { cancelDelete, confirmDelete, isDeleteOpen, requestDelete } =
    useLocalPlaylistDelete(handleDeleted)

  const orderedRest = isEditing ? sortByLocalOrder(restPlaylists, localOrderIds) : restPlaylists

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.myPlaylists}>
      <SafeAreaView
        edges={['bottom']}
        style={[styles.container, { backgroundColor: currentTheme.background }]}
      >
        <Stack.Screen options={headerOptions} />
        {isEditing ? (
          <MyPlaylistsEditView
            settings={settings}
            favorites={favorites}
            orderedRest={orderedRest}
            onDragEnd={setLocalOrderIds}
            onDeletePlaylist={requestDelete}
            onPressPlaylist={onPressPlaylist}
            onPressFavorites={onPressFavorites}
            onAppearanceChange={handleAppearanceChange}
          />
        ) : (
          <MyPlaylistsNormalView
            favorites={favorites}
            orderedRest={orderedRest}
            onPressPlaylist={onPressPlaylist}
            onPressCreate={() => setCreateVisible(true)}
          />
        )}
        <CreateLocalPlaylistModal
          visible={isCreateVisible}
          onClose={() => setCreateVisible(false)}
        />
        <LocalPlaylistDeleteDialog
          visible={isDeleteOpen}
          onCancel={cancelDelete}
          onConfirm={() => void confirmDelete()}
        />
      </SafeAreaView>
    </BlurBackdrop>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
