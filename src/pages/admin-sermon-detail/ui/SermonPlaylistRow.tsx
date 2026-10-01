import { ListItemBase } from 'entities/list-item'
import { type APITypes } from 'shared/api'
import { styles } from './styles'

// Строка плейлиста в детали проповеди: обложка и название.
// Тап открывает деталь плейлиста внутри админки.
export const SermonPlaylistRow = ({
  onPress,
  playlist,
}: {
  onPress: () => void
  playlist: APITypes.PlaylistEntity
}) => (
  <ListItemBase
    movingTitle
    onPress={onPress}
    variant='surface'
    title={playlist.title}
    artwork={playlist.artwork}
    style={styles.playlistRow}
  />
)
