import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Строка плейлиста в детали проповеди: обложка и название. Не открывает экран
// плейлиста (связь отображается только для сведения) — поэтому обычный View.
export const SermonPlaylistRow = ({ playlist }: { playlist: APITypes.PlaylistEntity }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.playlistRow, { backgroundColor: currentTheme.surface }]}>
      <CoverImage
        uri={playlist.artwork}
        style={styles.playlistArtwork}
        imageStyle={styles.playlistArtwork}
      />
      <Text numberOfLines={1} style={[styles.playlistTitle, { color: currentTheme.text }]}>
        {playlist.title}
      </Text>
    </View>
  )
}
