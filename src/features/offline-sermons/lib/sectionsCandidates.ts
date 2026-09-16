import { getCachedSections } from 'shared/lib/sections-cache'
import { type SermonCandidate } from '../model'

export const collectSectionCandidates = async (): Promise<SermonCandidate[]> => {
  const sections = await getCachedSections()
  if (!sections) return []

  return sections.flatMap(section =>
    (section.playlists ?? []).flatMap(playlist =>
      playlist.sermons.map(sermon => ({ playlist, sermon })),
    ),
  )
}
