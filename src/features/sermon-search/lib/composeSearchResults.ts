import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'

/**
 * Combines playlist matches: title matches first, then playlists reached through
 * the matched sermons' embedded `playlists` arrays. Duplicates (by id) are dropped,
 * so a playlist that also matched by title is not shown twice.
 * @param titleMatches - Playlists returned by the title/description search.
 * @param sermons - Fetched sermons whose embedded playlists may also match.
 */
export const mergePlaylistResults = (
  titleMatches: PlaylistData[],
  sermons: SermonData[],
): PlaylistData[] => {
  const seenIds = new Set(titleMatches.map(playlist => playlist.id))
  const contentMatches: PlaylistData[] = []

  for (const sermon of sermons)
    for (const playlist of sermon.playlists ?? []) {
      if (seenIds.has(playlist.id)) continue
      seenIds.add(playlist.id)
      contentMatches.push(playlist)
    }

  return [...titleMatches, ...contentMatches]
}

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
    if (!artist.toLowerCase().includes(normalizedQuery)) continue
    if (seen.has(artist)) continue
    seen.add(artist)
    preachers.push(artist)
  }

  return preachers
}
