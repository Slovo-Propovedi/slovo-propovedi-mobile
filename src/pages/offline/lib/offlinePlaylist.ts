import { type OfflineSermonItem } from 'features/offline-sermons'
import { type PlaylistData } from 'entities/playlist'

const OFFLINE_PLAYLIST_ID = 'offline-list'
const OFFLINE_PLAYLIST_TITLE = 'Офлайн'

/**
 * Pseudo-playlist of every offline sermon in the order the screen shows them.
 * It is the fallback playback context when a sermon has no real playlist: the
 * player queue is `currentPlaylistAtom.sermons`, so this keeps autoplay inside
 * the downloaded set instead of a one-sermon synthetic snapshot.
 * @param items - Offline screen items in screen order.
 */
export const buildOfflinePlaylist = (items: OfflineSermonItem[]): PlaylistData => ({
  artwork: null,
  description: '',
  id: OFFLINE_PLAYLIST_ID,
  sermons: items.map(item => item.sermon),
  title: OFFLINE_PLAYLIST_TITLE,
})
