import { type SermonData } from 'entities/sermon'

/**
 * Unique artists of the fetched sermons whose name contains the query (first-seen order).
 * @param sermons - Fetched sermons to scan for matching artists.
 * @param query - Raw search query; matched case-insensitively against the artist name.
 */
export const collectMatchingPreachers = (sermons: SermonData[], query: string): string[] => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const preachers: string[] = []
  const seen = new Set<string>()

  for (const { artist } of sermons) {
    if (!artist) continue
    if (!artist.toLowerCase().includes(normalizedQuery)) continue
    if (seen.has(artist)) continue
    seen.add(artist)
    preachers.push(artist)
  }

  return preachers
}
