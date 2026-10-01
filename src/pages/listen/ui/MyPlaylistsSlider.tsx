import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { type ReactNode, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import {
  loadMyPlaylists,
  loadSectionSettings,
  type LocalPlaylistData,
  myPlaylistsAtom,
  sectionSettingsAtom,
} from 'entities/playlist'
import { mapItemsSize, mapTransform, mapWhereIsTitleLocated } from 'entities/section'
import { getSliderItemWidth, Slider, type SliderItemsElement } from 'shared/ui'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { useListenNavigation } from '../lib/useListenNavigation'

const SECTION_TITLE = 'Мои плейлисты'
const ICON_SIZE_RATIO = 0.4
const FAVORITES_INDEX = 0

const toSliderItem = (
  playlist: LocalPlaylistData,
  artworkIcon?: ReactNode,
): SliderItemsElement<LocalPlaylistData> => ({
  artwork: null,
  artworkIcon,
  data: playlist,
  description: playlist.title,
})

// Завершающая секция экрана «Слушать»: карточка «Избранные» и карточки
// локальных плейлистов. Только чтение — редактирование порядка живёт на
// отдельном экране «Мои плейлисты», куда ведёт тап по заголовку секции.
// Внешний вид берётся из настроек оформления (`sectionSettingsAtom`).
export const MyPlaylistsSlider = () => {
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const [settings] = useAtom(sectionSettingsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const loadSettings = useAction(loadSectionSettings)
  const { navigateToMyPlaylists, navigateToPlaylist } = useListenNavigation()

  useEffect(() => {
    void loadPlaylists()
    void loadSettings()
  }, [loadPlaylists, loadSettings])

  const favorites = playlists[FAVORITES_INDEX]
  const restPlaylists = playlists.slice(FAVORITES_INDEX + 1)

  const onPressPlaylist = (playlist: LocalPlaylistData) =>
    navigateToPlaylist({ artwork: null, id: playlist.id, sermons: [], title: playlist.title })

  const iconSize = getSliderItemWidth(mapItemsSize(settings.itemsSize)) * ICON_SIZE_RATIO
  const heartIcon = <Ionicons name='heart' size={iconSize} color={currentTheme.primary} />
  const items = [toSliderItem(favorites, heartIcon), ...restPlaylists.map(it => toSliderItem(it))]

  return (
    <Slider
      items={items}
      style={styles.slider}
      title={SECTION_TITLE}
      onPressItem={onPressPlaylist}
      onPressTitle={navigateToMyPlaylists}
      itemsRows={settings.itemsRows ?? undefined}
      itemsSize={mapItemsSize(settings.itemsSize)}
      transform={mapTransform(settings.transform)}
      isDescriptionTitleOnSlideLarge={settings.isDescriptionTitleOnSlideLarge}
      whereIsSlideTitleLocated={mapWhereIsTitleLocated(settings.whereIsSlideTitleLocated)}
    />
  )
}

const styles = StyleSheet.create({
  slider: { paddingHorizontal: INDENTS.middle },
})
