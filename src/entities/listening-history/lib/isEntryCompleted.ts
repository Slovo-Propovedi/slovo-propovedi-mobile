import { COMPLETION_REMAINING_MS } from './constants'

// Работает и для записей каталога (ListeningHistoryEntry), и для записей
// per-sermon хранилища прогресса (SermonProgressRecord) — обе формы несут
// durationMs/positionMs.
export const isEntryCompleted = (entry: { durationMs: number; positionMs: number }): boolean => {
  if (entry.durationMs <= 0) return false
  if (entry.durationMs <= COMPLETION_REMAINING_MS) return entry.positionMs >= entry.durationMs
  return entry.positionMs >= entry.durationMs - COMPLETION_REMAINING_MS
}
