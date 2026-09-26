import { getCachedSections } from 'entities/section'

export const resolvePlaylistFromCache = async (playlistId: string) => {
  const cachedSections = await getCachedSections()
  return cachedSections?.flatMap(s => s.playlists ?? []).find(p => p.id === playlistId)
}
