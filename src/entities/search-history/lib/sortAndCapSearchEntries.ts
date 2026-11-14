import { MAX_SEARCH_HISTORY_ENTRIES } from '../model/constants'
import { type SearchHistory, type SearchHistoryEntry } from '../model/types'

export const sortAndCapSearchEntries = (entries: SearchHistory): SearchHistory => {
  const deduped = new Map<string, SearchHistoryEntry>()

  for (const entry of entries) {
    const existing = deduped.get(entry.sermon.id)
    if (!existing || entry.savedAt > existing.savedAt) deduped.set(entry.sermon.id, entry)
  }

  return [...deduped.values()]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, MAX_SEARCH_HISTORY_ENTRIES)
}
