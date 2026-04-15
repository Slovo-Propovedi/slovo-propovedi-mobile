import type { FetchedSermonsGroupName, PlaylistData } from 'shared/model'
import { sectionsApi } from './generated'
import { mapAllSectionsResponse, mapPlaylistEntities } from './lib/mappers'

/**
 * Получить плейлисты по группе через секции.
 * Загружает все секции, находит нужную по title и возвращает её плейлисты.
 * @param tabName - Название группы проповедей.
 * @returns Плейлисты группы или null.
 */
const getPlaylistsOnSermonsGroup = async (
  tabName: FetchedSermonsGroupName,
): Promise<null | PlaylistData[]> => {
  const sections = mapAllSectionsResponse(await sectionsApi.getSections().getAllSections())
  const section = sections.find(el => el.title === tabName)

  if (!section?.playlists) return null

  return mapPlaylistEntities(section.playlists)
}

export const sermonsAPI = {
  getPlaylistsOnSermonsGroup,
}
