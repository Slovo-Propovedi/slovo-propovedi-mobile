import { memo } from 'react'
import { type PlaylistData } from 'entities/playlist'
import { SearchListItem } from './SearchListItem'

export const SearchPlaylistRow = memo(
  ({
    onPress,
    playlist,
  }: {
    onPress: (playlist: PlaylistData) => void
    playlist: PlaylistData
  }) => (
    <SearchListItem
      title={playlist.title}
      artwork={playlist.artwork}
      subtitle={playlist.description}
      onPress={() => onPress(playlist)}
    />
  ),
)
