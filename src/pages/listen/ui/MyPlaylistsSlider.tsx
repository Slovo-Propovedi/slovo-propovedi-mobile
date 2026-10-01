import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  FAVORITES_PLAYLIST,
  loadMyPlaylists,
  type LocalPlaylistData,
  myPlaylistsAtom,
} from 'entities/playlist'
import { getSliderItemWidth, SliderItem, SliderItemSize } from 'shared/ui'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { useListenNavigation } from '../lib/useListenNavigation'
import { MyPlaylistsDragList } from './MyPlaylistsDragList'
import { MyPlaylistsHeader } from './MyPlaylistsHeader'
import { useReorderPlaylists } from './useReorderPlaylists'

const SECTION_TITLE = 'Мои плейлисты'
const ICON_SIZE_RATIO = 0.4
const FAVORITES_INDEX = 0

// Порядок карточек из режима редактирования: неизвестные id (конкурентно
// добавленный плейлист) уезжают в конец, известные сортируются по позиции.
const sortByLocalOrder = (playlists: LocalPlaylistData[], orderedIds: string[]) => {
  const rank = new Map(orderedIds.map((id, index) => [id, index]))
  return [...playlists].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
}

export const MyPlaylistsSlider = () => {
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const { navigateToPlaylist } = useListenNavigation()
  const reorderPlaylists = useReorderPlaylists()

  // null — обычный режим; массив id — открытый режим редактирования с локальным
  // порядком (атом не трогается до «Сохранить»). Уход с экрана сбрасывает state.
  const [localOrderIds, setLocalOrderIds] = useState<null | string[]>(null)

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  const iconSize = getSliderItemWidth(SliderItemSize.Small) * ICON_SIZE_RATIO
  const heartIcon = <Ionicons name='heart' size={iconSize} color={currentTheme.primary} />
  const favorites = playlists[FAVORITES_INDEX]

  const isEditing = localOrderIds !== null
  const restPlaylists = playlists.slice(FAVORITES_INDEX + 1)
  const orderedRest = isEditing ? sortByLocalOrder(restPlaylists, localOrderIds) : restPlaylists

  const onPressPlaylist = (playlist: LocalPlaylistData) =>
    navigateToPlaylist({
      artwork: null,
      id: playlist.id,
      sermons: [],
      title: playlist.title,
    })

  const handleEditToggle = () => {
    setLocalOrderIds(current => (current ? null : restPlaylists.map(playlist => playlist.id)))
  }

  const handleDragEnd = (orderedIds: string[]) => {
    setLocalOrderIds(orderedIds)
  }

  const handleSave = () => {
    if (!localOrderIds) return
    reorderPlaylists([FAVORITES_PLAYLIST.id, ...localOrderIds])
    setLocalOrderIds(null)
  }

  return (
    <View style={[styles.slider, { marginTop: FONT_SIZES.h2 / 2 }]}>
      <MyPlaylistsHeader
        onSave={handleSave}
        title={SECTION_TITLE}
        isEditing={isEditing}
        onToggleEdit={handleEditToggle}
      />
      <SliderItem
        artwork={null}
        artworkIcon={heartIcon}
        size={SliderItemSize.Small}
        descriptionTitle={favorites.title}
        onPress={isEditing ? undefined : () => onPressPlaylist(favorites)}
      />
      <MyPlaylistsDragList
        items={orderedRest}
        onDragEnd={handleDragEnd}
        isDraggingEnabled={isEditing}
        onPressItem={onPressPlaylist}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  slider: { maxWidth: '100%', paddingHorizontal: INDENTS.middle },
})
