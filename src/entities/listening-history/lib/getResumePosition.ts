import { type ListeningHistory } from '../model/types'
import { isEntryCompleted } from './isEntryCompleted'

export const getResumePosition = (entries: ListeningHistory, sermonId: string): number => {
  const entry = entries.find(e => e.sermon.id === sermonId)
  if (!entry) return 0
  if (isEntryCompleted(entry)) return 0
  if (entry.positionMs <= 0) return 0
  return entry.positionMs
}
