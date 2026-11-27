import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import {
  PlaylistList,
  type PlaylistListItemData,
  PlaylistListSeparator,
} from 'widgets/playlist-list'
import { getListItemCardArtworkSize } from 'entities/list-item'
import { type LocalPlaylistData } from 'entities/playlist'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { MyPlaylistsCreateRow } from './MyPlaylistsCreateRow'
import { MyPlaylistsMarkerAvatar } from './MyPlaylistsMarkerAvatar'

const HEART_ICON = 'heart'
const SECTION_TITLE = 'Мои плейлисты'

// Просмотровый режим экрана «Мои плейлисты»: то же тело списка, что у серверного
// списка секции (`PlaylistList` — схлопывающийся заголовок, карточные строки и
// разделители). Строка «Избранные» идёт первым элементом списка — её обложку
// подменяет маркер-сердце; ниже — локальные плейлисты; завершающей строкой
// футера — «Создать плейлист», то есть под плейлистами. Между списком и строкой
// создания — тот же разделитель (`PlaylistListSeparator`), что и между строками.
export const MyPlaylistsNormalView = ({
  favorites,
  onPressCreate,
  onPressPlaylist,
  orderedRest,
}: {
  favorites?: LocalPlaylistData
  onPressCreate: () => void
  onPressPlaylist: (item: PlaylistListItemData) => void
  orderedRest: LocalPlaylistData[]
}) => {
  const { currentTheme } = useTheme()

  const favoritesItem: PlaylistListItemData | undefined = favorites
    ? {
        ...favorites,
        artworkNode: (
          <MyPlaylistsMarkerAvatar
            size={getListItemCardArtworkSize()}
            renderIcon={iconSize => (
              <Ionicons size={iconSize} name={HEART_ICON} color={currentTheme.primary} />
            )}
          />
        ),
      }
    : undefined

  const items: PlaylistListItemData[] = favoritesItem
    ? [favoritesItem, ...orderedRest]
    : orderedRest

  return (
    <PlaylistList
      playlists={items}
      title={SECTION_TITLE}
      onPressPlaylist={onPressPlaylist}
      listFooter={
        <View style={styles.create}>
          {items.length > 0 && <PlaylistListSeparator />}
          <MyPlaylistsCreateRow onPress={onPressCreate} onboardingTargetId='playlists.create' />
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  create: { marginBottom: INDENTS.middle },
})
