import { type LocalPlaylistData, type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'

// History/registry snapshots may carry a synthetic single-sermon playlist
// (`buildManualPlaylist`: id = sermon id, exactly this sermon). It is not a real
// playlist and must not be offered as a playback context.
const isSyntheticOrigin = (
  playlist: null | PlaylistData | undefined,
  sermon: AudioPlayerData,
): boolean =>
  playlist !== null &&
  playlist !== undefined &&
  playlist.id === sermon.id &&
  playlist.sermons.length === 1 &&
  playlist.sermons[0].id === sermon.id

const toPlayablePlaylist = (local: LocalPlaylistData): PlaylistData => ({
  artwork: null,
  description: '',
  id: local.id,
  sermons: local.sermons,
  title: local.title,
})

const holdsSermon = (local: LocalPlaylistData, sermonId: string): boolean =>
  local.sermons.some(sermon => sermon.id === sermonId)

/**
 * Playback contexts available without a network request: the real origin
 * playlist, membership refs that already carry a local queue, and user
 * playlists holding the sermon snapshot. Light refs (`sermons: []`) are dropped
 * because resolving them would need the API — the chooser stays local.
 * Candidates are deduped by playlist id, origin first.
 * @param localPlaylists - `myPlaylistsAtom` entries.
 * @param sermon - Tapped sermon with its playlist membership refs.
 * @param originPlaylist - Playlist the sermon was tapped from, if any.
 */
export const collectPlaybackCandidates = (
  localPlaylists: LocalPlaylistData[],
  sermon: AudioPlayerData,
  originPlaylist?: null | PlaylistData,
): PlaylistData[] => {
  const candidates: PlaylistData[] = []
  const seen = new Set<string>()

  const add = (playlist: PlaylistData) => {
    if (seen.has(playlist.id)) return
    seen.add(playlist.id)
    candidates.push(playlist)
  }

  if (originPlaylist && !isSyntheticOrigin(originPlaylist, sermon)) add(originPlaylist)

  for (const playlist of sermon.playlists ?? []) if (playlist.sermons.length > 0) add(playlist)

  for (const local of localPlaylists)
    if (holdsSermon(local, sermon.id)) add(toPlayablePlaylist(local))

  return candidates
}
