import { Ionicons } from '@expo/vector-icons'
import { getListItemCardArtworkSize, ListItemBase } from 'entities/list-item'
import { type LocalPlaylistData } from 'entities/playlist'
import { useLayoutBaseWidth } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { MyPlaylistsMarkerAvatar } from './MyPlaylistsMarkerAvatar'

const HEART_ICON = 'heart'
// Card rows carry no own bottom margin (the server list spaces them with a
// separator); this list has none, so the row keeps the previous rhythm.
const ROW_STYLE = { marginBottom: INDENTS.medium }

// Строка «Избранные»: первая в списке (не закреплена — скроллится вместе с
// остальными), не перетаскивается. Сердце — тот же визуальный маркер, что у
// карточки на экране «Слушать»; оно лежит в слоте обложки `card`-строки
// серверного списка плейлистов (`PlaylistListItem`), поэтому строка совпадает
// по геометрии с карточными строками плейлистов.
export const MyPlaylistsFavoritesRow = ({
  onPress,
  playlist,
}: {
  onPress: () => void
  playlist: LocalPlaylistData
}) => {
  const { currentTheme } = useTheme()
  const baseWidth = useLayoutBaseWidth()

  return (
    <ListItemBase
      onPress={onPress}
      style={ROW_STYLE}
      title={playlist.title}
      artworkNode={
        <MyPlaylistsMarkerAvatar
          size={getListItemCardArtworkSize(baseWidth)}
          renderIcon={iconSize => (
            <Ionicons size={iconSize} name={HEART_ICON} color={currentTheme.primary} />
          )}
        />
      }
    />
  )
}
