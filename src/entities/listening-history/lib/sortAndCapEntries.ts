import { type ListeningHistory } from '../model/types'
import { MAX_HISTORY_ENTRIES } from './constants'
import { getEntrySermon } from './getEntrySermon'

export const sortAndCapEntries = (entries: ListeningHistory): ListeningHistory => {
  const deduped = new Map<string, (typeof entries)[number]>()

  for (const entry of entries) {
    const existing = deduped.get(getEntrySermon(entry).id)
    if (!existing || entry.lastPlayedAt > existing.lastPlayedAt)
      deduped.set(getEntrySermon(entry).id, entry)
  }

  return [...deduped.values()]
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
    .slice(0, MAX_HISTORY_ENTRIES)
}
