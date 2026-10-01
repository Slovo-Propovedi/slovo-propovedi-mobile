import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'

/**
 * Returns the history entry with the greatest `lastPlayedAt` whose sermon
 * belongs to the playlist, or null when the playlist has no listened sermon.
 *
 * Entries without a resolvable sermon are ignored — they cannot be matched to
 * a playlist position and cannot drive a "continue listening" target.
 * @param playlist - The playlist whose sermons are matched against history.
 * @param history - The full listening history to search.
 */
export const findLastListenedSermon = (
  playlist: PlaylistData,
  history: ListeningHistory,
): ListeningHistoryEntry | null => {
  const playlistSermonIds = new Set(playlist.sermons.map(sermon => sermon.id))
  let latest: ListeningHistoryEntry | null = null

  for (const entry of history) {
    const sermonId = getEntrySermon(entry)?.id
    if (!sermonId || !playlistSermonIds.has(sermonId)) continue
    if (!latest || entry.lastPlayedAt > latest.lastPlayedAt) latest = entry
  }

  return latest
}
