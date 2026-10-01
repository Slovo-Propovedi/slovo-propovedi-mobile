import { LIST_ITEM_CARD_ARTWORK_SIZE, ListItemBase } from 'entities/list-item'
import { type PlaylistData } from 'entities/playlist'

export const ALBUM_ART_SIZE = LIST_ITEM_CARD_ARTWORK_SIZE

export const PlaylistListItem = ({
  onPress,
  playlist,
}: {
  onPress: () => void
  playlist: PlaylistData
}) => (
  <ListItemBase
    onPress={onPress}
    title={playlist.title}
    artwork={playlist.artwork}
    subtitle={playlist.description}
  />
)
