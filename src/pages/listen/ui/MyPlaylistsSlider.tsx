import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { loadMyPlaylists, type LocalPlaylistData, myPlaylistsAtom } from 'entities/playlist'
import { getSliderItemWidth, SliderItem, SliderItemSize, SliderTitle } from 'shared/ui'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { useListenNavigation } from '../lib/useListenNavigation'

const SECTION_TITLE = 'Мои плейлисты'
const ICON_SIZE_RATIO = 0.4
const FAVORITES_INDEX = 0

// Строка горизонтального списка: карточка локального плейлиста с тапом на переход.
const renderPlaylist = (
  playlist: LocalPlaylistData,
  onPress: (playlist: LocalPlaylistData) => void,
) => (
  <SliderItem
    artwork={null}
    size={SliderItemSize.Small}
    descriptionTitle={playlist.title}
    onPress={() => onPress(playlist)}
  />
)

// Завершающая секция экрана «Слушать»: карточка «Избранные» и карточки
// локальных плейлистов. Только чтение — редактирование порядка живёт на
// отдельном экране «Мои плейлисты», куда ведёт тап по заголовку секции.
export const MyPlaylistsSlider = () => {
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const loadPlaylists = useAction(loadMyPlaylists)
  const { navigateToMyPlaylists, navigateToPlaylist } = useListenNavigation()

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  const iconSize = getSliderItemWidth(SliderItemSize.Small) * ICON_SIZE_RATIO
  const heartIcon = <Ionicons name='heart' size={iconSize} color={currentTheme.primary} />
  const favorites = playlists[FAVORITES_INDEX]
  const restPlaylists = playlists.slice(FAVORITES_INDEX + 1)

  const onPressPlaylist = (playlist: LocalPlaylistData) =>
    navigateToPlaylist({ artwork: null, id: playlist.id, sermons: [], title: playlist.title })

  return (
    <View style={[styles.slider, { marginTop: FONT_SIZES.h2 / 2 }]}>
      <View style={styles.title}>
        <SliderTitle
          title={SECTION_TITLE}
          fontSize={FONT_SIZES.h2}
          onPress={navigateToMyPlaylists}
        />
      </View>
      <SliderItem
        artwork={null}
        artworkIcon={heartIcon}
        size={SliderItemSize.Small}
        descriptionTitle={favorites.title}
        onPress={() => onPressPlaylist(favorites)}
      />
      <FlatList
        horizontal
        data={restPlaylists}
        keyExtractor={playlist => playlist.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => renderPlaylist(item, onPressPlaylist)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  content: { gap: INDENTS.middle, paddingHorizontal: INDENTS.middle },
  slider: { maxWidth: '100%', paddingHorizontal: INDENTS.middle },
  title: { paddingHorizontal: INDENTS.lowest },
})
