import { type PlaylistData } from 'entities/playlist/@x/listening-history'
import {
  dynamicSectionsAtom,
  getCachedSections,
  type SectionData,
} from 'entities/section/@x/listening-history'
import { ctx } from 'shared/lib/reatom-ctx'

const findPlaylistBySermon = (
  sections: SectionData[],
  playlistId: string,
  sermonId: string,
): PlaylistData | undefined =>
  sections
    .flatMap(section => section.playlists ?? [])
    .find(p => p.id === playlistId && p.sermons.some(s => s.id === sermonId))

/**
 * Find the full playlist `playlistId` when it contains `sermonId`.
 * Searches the live `dynamicSectionsAtom` first, then the sections cache,
 * and falls back to `fallbackPlaylist`.
 * @param playlistId - Id of the playlist to resolve.
 * @param sermonId - Sermon that must be present in the playlist; `null` skips the search.
 * @param fallbackPlaylist - Returned when no section has the playlist with the sermon.
 * @returns The full `PlaylistData` (with the complete sermons array for queue + auto-advance)
 *   or `fallbackPlaylist`.
 */
export const resolvePlaylistBySermon = async (
  playlistId: string,
  sermonId: null | string,
  fallbackPlaylist: PlaylistData,
): Promise<PlaylistData> => {
  if (!sermonId) return fallbackPlaylist

  const live = findPlaylistBySermon(ctx.get(dynamicSectionsAtom), playlistId, sermonId)
  if (live) return live

  const cached = await getCachedSections()
  const fromCache = cached ? findPlaylistBySermon(cached, playlistId, sermonId) : undefined

  return fromCache ?? fallbackPlaylist
}
