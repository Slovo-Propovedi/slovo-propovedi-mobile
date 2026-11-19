import { type ListeningHistory } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { type SermonProgressRecord } from './progressStorage'

/**
 * Derives per-sermon progress records from catalog entries that have no record
 * in `existing` yet — legacy migration and backup import both turn catalog
 * entries into progress records this way. Entries at position 0 carry no
 * «listened» information and are skipped.
 * @param entries - Catalog entries to derive from.
 * @param existing - Progress records that must not be overwritten.
 */
export const deriveProgressRecords = (
  entries: ListeningHistory,
  existing: Record<string, SermonProgressRecord>,
): Record<string, SermonProgressRecord> => {
  const derived: Record<string, SermonProgressRecord> = {}

  for (const entry of entries) {
    const sermonId = getEntrySermon(entry)?.id
    if (!sermonId || existing[sermonId] || entry.positionMs <= 0) continue

    derived[sermonId] = {
      durationMs: entry.durationMs,
      positionMs: entry.positionMs,
      updatedAt: entry.lastPlayedAt,
    }
  }

  return derived
}
