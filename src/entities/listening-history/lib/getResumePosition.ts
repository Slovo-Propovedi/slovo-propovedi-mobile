import { type ListeningHistory } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'
import { type SermonProgressRecord } from './progressStorage'

const resumeFrom = (positionMs: number, durationMs: number): number => {
  if (isEntryCompleted({ durationMs, positionMs })) return 0
  if (positionMs <= 0) return 0
  return positionMs
}

/**
 * Resume position for a sermon: the catalog entry wins; when the sermon is
 * evicted from the capped (100 entries) catalog, the per-sermon progress
 * record is the fallback.
 * @param entries - Listening history catalog (capped, most recent first).
 * @param sermonId - Id of the sermon to resume.
 * @param progressRecords - Per-sermon progress records keyed by sermon id.
 */
export const getResumePosition = (
  entries: ListeningHistory,
  sermonId: string,
  progressRecords: Record<string, SermonProgressRecord>,
): number => {
  const entry = entries.find(e => getEntrySermon(e)?.id === sermonId)
  if (entry) return resumeFrom(entry.positionMs, entry.durationMs)

  const record = progressRecords[sermonId]
  if (!record) return 0
  return resumeFrom(record.positionMs, record.durationMs)
}
