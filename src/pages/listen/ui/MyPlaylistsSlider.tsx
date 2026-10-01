import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { loadMyPlaylists, type LocalPlaylistData, myPlaylistsAtom } from 'entities/playlist'
import { SliderItem } from 'shared/ui/slider/slider-item/slider-item'
import { getSliderItemWidth } from 'shared/ui/slider/slider-item/slider-item.lib'
import { SliderItemSize } from 'shared/ui/slider/slider-item/slider-item.types'
import { SliderTitle } from 'shared/ui/slider/slider-title'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { useListenNavigation } from '../lib/useListenNavigation'
import { MyPlaylistsDragList } from './MyPlaylistsDragList'
import { useReorderPlaylists } from './useReorderPlaylists'

const SECTION_TITLE = 'Мои плейлисты'
const ICON_SIZE_RATIO = 0.4
const FAVORITES_INDEX = 0

export const MyPlaylistsSlider = () => {
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const { navigateToPlaylist } = useListenNavigation()
  const reorderPlaylists = useReorderPlaylists()

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  if (!playlists.length) return null

  const iconSize = getSliderItemWidth(SliderItemSize.Small) * ICON_SIZE_RATIO
  const heartIcon = <Ionicons name='heart' size={iconSize} color={currentTheme.primary} />
  const favorites = playlists[FAVORITES_INDEX]

  const onPressPlaylist = (playlist: LocalPlaylistData) =>
    navigateToPlaylist({
      artwork: null,
      id: playlist.id,
      sermons: [],
      title: playlist.title,
    })

  return (
    <View style={[styles.slider, { marginTop: FONT_SIZES.h2 / 2 }]}>
      <SliderTitle title={SECTION_TITLE} fontSize={FONT_SIZES.h2} />
      <SliderItem
        artwork={null}
        artworkIcon={heartIcon}
        size={SliderItemSize.Small}
        descriptionTitle={favorites.title}
        onPress={() => onPressPlaylist(favorites)}
      />
      <MyPlaylistsDragList
        items={playlists}
        onDragEnd={reorderPlaylists}
        onPressItem={onPressPlaylist}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  slider: { maxWidth: '100%', paddingHorizontal: INDENTS.middle },
})
