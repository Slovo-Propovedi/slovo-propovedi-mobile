import { type ListeningHistory } from '../model/types'
import { MAX_HISTORY_ENTRIES } from './constants'

export const sortAndCapEntries = (entries: ListeningHistory): ListeningHistory => {
  const deduped = new Map<string, (typeof entries)[number]>()

  for (const entry of entries) {
    const existing = deduped.get(entry.sermon.id)
    if (!existing || entry.lastPlayedAt > existing.lastPlayedAt) deduped.set(entry.sermon.id, entry)
  }

  return [...deduped.values()]
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
    .slice(0, MAX_HISTORY_ENTRIES)
}
