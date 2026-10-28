import { resolvePlaylistBySermon } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'

/**
 * A history tap keeps the entry's playlist as its playback context. When the
 * chooser has no candidates, resolve the full playlist from sections so the
 * queue and auto-advance survive; the entry snapshot is the last resort.
 * @param sermon - Tapped sermon; identifies the playlist entry inside sections.
 * @param originPlaylist - Playlist the history entry was played from.
 */
export const resolveEntryFallbackPlaylist = async (
  sermon: AudioPlayerData,
  originPlaylist: null | PlaylistData,
): Promise<PlaylistData | undefined> =>
  originPlaylist ? resolvePlaylistBySermon(originPlaylist.id, sermon.id, originPlaylist) : undefined
