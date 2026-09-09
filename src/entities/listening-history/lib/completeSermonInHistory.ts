import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { buildHistoryEntry } from './buildHistoryEntry'
import { MANUAL_LISTENED_DURATION_MS } from './constants'
import { getEntrySermon } from './getEntrySermon'

/**
 * Pure per-sermon upsert of a completed history entry, applied to `entries`.
 *
 * - No entry for the sermon → prepend a synthetic-completed entry
 *   (MANUAL_LISTENED_DURATION_MS). The caller owns the final sort/cap pass.
 * - Existing entry → complete it in place, keeping `lastPlayedAt` and its
 *   list position; zero-duration entries fall back to the manual duration.
 *
 * Used by both markSermonListenedAction and markSermonsListenedAction so the
 * per-sermon semantics stay byte-identical.
 * @param entries - Current history entries to upsert into.
 * @param sermon - Sermon to mark as listened (guaranteed playable audio).
 * @param playlist - Context playlist snapshot stored with new entries.
 * @param now - Timestamp for newly created entries.
 */
export const completeSermonInHistory = (
  entries: ListeningHistory,
  sermon: AudioPlayerData,
  playlist: PlaylistData,
  now: number,
): ListeningHistory => {
  const index = entries.findIndex(e => getEntrySermon(e)?.id === sermon.id)

  if (index === -1) {
    const entry = buildHistoryEntry(sermon, playlist, now)
    const completedEntry: ListeningHistoryEntry = {
      ...entry,
      durationMs: MANUAL_LISTENED_DURATION_MS,
      positionMs: MANUAL_LISTENED_DURATION_MS,
    }
    return [completedEntry, ...entries]
  }

  const existing = entries[index]
  const durationMs = existing.durationMs > 0 ? existing.durationMs : MANUAL_LISTENED_DURATION_MS
  const updated: ListeningHistoryEntry = { ...existing, durationMs, positionMs: durationMs }
  return [...entries.slice(0, index), updated, ...entries.slice(index + 1)]
}
