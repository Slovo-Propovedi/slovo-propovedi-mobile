import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { buildSanitizedSermon } from './buildHistoryEntry'

/**
 * Builds a synthetic single-sermon playlist snapshot from a sermon.
 *
 * Used when no context playlist is available (manual mark, progress flush):
 * the entry still needs a valid `playlist` snapshot, so we derive a slim
 * playlist from the sermon itself (id = sermon.id, one sanitized sermon).
 * @param sermon - Sermon to derive the playlist from.
 */
export const buildManualPlaylist = (sermon: AudioPlayerData): PlaylistData => ({
  artwork: sermon.artwork,
  description: '',
  id: sermon.id,
  sermons: [buildSanitizedSermon(sermon)],
  title: sermon.title,
})
