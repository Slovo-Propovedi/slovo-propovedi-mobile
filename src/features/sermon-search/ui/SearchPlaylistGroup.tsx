import { type PlaylistData } from 'entities/playlist'
import { SearchGroup } from './SearchGroup'
import { SearchPlaylistRow } from './SearchPlaylistRow'

const PLAYLISTS_LABEL = 'Плейлисты'
const MAX_PLAYLIST_RESULTS = 4

export const SearchPlaylistGroup = ({
  onPress,
  onShowAll,
  playlists,
}: {
  onPress: (playlist: PlaylistData) => void
  onShowAll: () => void
  playlists: PlaylistData[]
}) => (
  <SearchGroup onPress={onShowAll} label={PLAYLISTS_LABEL} count={playlists.length}>
    {playlists.slice(0, MAX_PLAYLIST_RESULTS).map(playlist => (
      <SearchPlaylistRow key={playlist.id} onPress={onPress} playlist={playlist} />
    ))}
  </SearchGroup>
)
