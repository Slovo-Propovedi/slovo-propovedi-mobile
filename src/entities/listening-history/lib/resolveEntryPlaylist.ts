import { dynamicSectionsAtom } from 'entities/section/@x/listening-history'
import { ctx } from 'shared/lib/reatom-ctx'
import { getCachedSections } from 'shared/lib/sections-cache'
import { type PlaylistData, type SectionData } from 'shared/model'
import { type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'

/**
 * Find the full playlist containing the sermon from a history entry.
 * Searches the live `dynamicSectionsAtom` first, then the sections cache,
 * and falls back to the snapshot playlist stored in the entry itself.
 * @param entry - A history entry whose `playlist.id` identifies the original playlist
 *   and whose sermon id matches one of the playlist's sermons.
 * @returns The full `PlaylistData` (with the complete sermons array for queue + auto-advance)
 *   or the original snapshot playlist as a fallback.
 */
export const resolveEntryPlaylist = async (entry: ListeningHistoryEntry): Promise<PlaylistData> => {
  const sermonId = getEntrySermon(entry)?.id
  if (!sermonId) return entry.playlist

  const playlistId = entry.playlist.id

  const findPlaylist = (sections: SectionData[]): PlaylistData | undefined =>
    sections
      .flatMap(section => section.playlists ?? [])
      .find(p => p.id === playlistId && p.sermons.some(s => s.id === sermonId))

  const live = findPlaylist(ctx.get(dynamicSectionsAtom))
  if (live) return live

  const cached = await getCachedSections()
  const fromCache = cached ? findPlaylist(cached) : undefined
  if (fromCache) return fromCache

  return entry.playlist
}
