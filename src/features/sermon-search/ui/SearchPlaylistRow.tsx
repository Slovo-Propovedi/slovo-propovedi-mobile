import { memo } from 'react'
import { ListItemBase } from 'entities/list-item'
import { type PlaylistData } from 'entities/playlist'

export const SearchPlaylistRow = memo(
  ({
    onPress,
    playlist,
  }: {
    onPress: (playlist: PlaylistData) => void
    playlist: PlaylistData
  }) => (
    <ListItemBase
      title={playlist.title}
      artwork={playlist.artwork}
      subtitle={playlist.description}
      onPress={() => onPress(playlist)}
    />
  ),
)
