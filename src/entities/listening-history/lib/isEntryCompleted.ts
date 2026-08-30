import { type ListeningHistoryEntry } from '../model/types'
import { COMPLETION_REMAINING_MS } from './constants'

export const isEntryCompleted = (entry: ListeningHistoryEntry): boolean => {
  if (entry.durationMs <= 0) return false
  if (entry.durationMs <= COMPLETION_REMAINING_MS) return entry.positionMs >= entry.durationMs
  return entry.positionMs >= entry.durationMs - COMPLETION_REMAINING_MS
}
