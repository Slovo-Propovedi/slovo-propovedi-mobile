import type { FetchedSermonsGroupName, PlaylistData } from 'shared/model'
import { localDB } from './localBD'

/**
 * Получить плейлисты по группе.
 * @param tabName - Название группы проповедей.
 * @returns Плейлисты группы или null.
 *
 * TODO: Заменить на вызов getAllPlaylists из Orval когда бэкенд будет готов.
 */
const getPlaylistsOnSermonsGroup = async (
  tabName: FetchedSermonsGroupName,
): Promise<null | PlaylistData[]> => {
  const sermons = localDB.getSermons()
  const content = sermons.find(el => el.groupName === tabName)

  if (!content) return null

  return content.playlists

  // Реализация с бэкендом (когда будет готов):
  // const response = await getAllPlaylists()
  // return mapAllPlaylistsResponse(response)
}

export const sermonsAPI = {
  getPlaylistsOnSermonsGroup,
}
