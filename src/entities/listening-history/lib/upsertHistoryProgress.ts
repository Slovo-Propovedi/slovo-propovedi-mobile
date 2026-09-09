import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { type ListeningHistory } from '../model/types'
import { buildHistoryEntry } from './buildHistoryEntry'
import { buildManualPlaylist } from './buildManualPlaylist'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'
import { sortAndCapEntries } from './sortAndCapEntries'

/**
 * Pure upsert of a history entry: create-or-update, preserving list position.
 *
 * Create path: builds a fresh entry via `buildHistoryEntry` + `buildManualPlaylist`
 * fallback, then applies the flush's position and duration.
 * Update path: overwrites `positionMs` and `durationMs` on the existing entry
 * without touching `lastPlayedAt` or list position.
 *
 * Returns `null` when nothing changed (no-op flush or deferred-guard skip) so
 * the caller can skip the commit and snapshot clear.
 * @param entries - Current history catalog.
 * @param params - Flush payload.
 * @param params.deferred - Seek-debounce flushes skip completed entries.
 * @param params.durationMs - Real track duration to write.
 * @param params.playlist - Context playlist; falls back to a synthetic one.
 * @param params.positionMs - Real playback position to write.
 * @param params.sermon - Sermon being flushed.
 * @param now - Timestamp for a freshly created entry.
 */
export const upsertHistoryProgress = (
  entries: ListeningHistory,
  params: {
    deferred?: boolean
    durationMs: number
    playlist?: PlaylistData
    positionMs: number
    sermon: AudioPlayerData
  },
  now: number,
): ListeningHistory | null => {
  const index = entries.findIndex(e => getEntrySermon(e)?.id === params.sermon.id)

  if (index === -1) {
    const entry = buildHistoryEntry(
      params.sermon,
      params.playlist ?? buildManualPlaylist(params.sermon),
      now,
    )
    const created = {
      ...entry,
      // buildHistoryEntry always starts durationMs at 0 — apply the real one.
      durationMs: params.durationMs > 0 ? params.durationMs : 0,
      positionMs: params.positionMs,
    }
    return sortAndCapEntries([created, ...entries])
  }

  const entry = entries[index]

  // Stale-flush protection: only deferred (seek-debounce) flushes skip
  // completed entries — immediate flushes reflect real listening.
  if (params.deferred && isEntryCompleted(entry)) return null

  const resolvedDurationMs = params.durationMs > 0 ? params.durationMs : entry.durationMs
  if (entry.positionMs === params.positionMs && entry.durationMs === resolvedDurationMs) return null

  const updated = {
    ...entry,
    durationMs: resolvedDurationMs,
    positionMs: params.positionMs,
  }
  return [...entries.slice(0, index), updated, ...entries.slice(index + 1)]
}
