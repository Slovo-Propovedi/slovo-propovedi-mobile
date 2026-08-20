import { type ListeningHistoryEntry } from '../model/types'
import { COMPLETION_REMAINING_MS } from './constants'

export const isEntryCompleted = (entry: ListeningHistoryEntry): boolean =>
  entry.durationMs > COMPLETION_REMAINING_MS &&
  entry.positionMs >= entry.durationMs - COMPLETION_REMAINING_MS
