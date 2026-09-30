import { View } from 'react-native'
import { type APITypes } from 'shared/api'
import { CoverImage, MovingText } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Строка плейлиста в детали проповеди: обложка и название.
// Тап открывает деталь плейлиста внутри админки.
export const SermonPlaylistRow = ({
  onPress,
  playlist,
}: {
  onPress: () => void
  playlist: APITypes.PlaylistEntity
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.playlistRow, { backgroundColor: currentTheme.surface }]}
    >
      <CoverImage
        uri={playlist.artwork}
        style={styles.playlistArtwork}
        imageStyle={styles.playlistArtwork}
      />
      <View style={styles.playlistTitleWrap}>
        <MovingText text={playlist.title} style={styles.playlistTitle} />
      </View>
    </TouchableItem>
  )
}
