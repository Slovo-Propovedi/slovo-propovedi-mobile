import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { loadMyPlaylists, type LocalPlaylistData, myPlaylistsAtom } from 'entities/playlist'
import { getSliderItemWidth, SliderItem, SliderItemSize, SliderTitle } from 'shared/ui'
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
        onDragEnd={reorderPlaylists}
        onPressItem={onPressPlaylist}
        items={playlists.slice(FAVORITES_INDEX + 1)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  slider: { maxWidth: '100%', paddingHorizontal: INDENTS.middle },
})
