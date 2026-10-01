import { type APITypes, playlistsApi } from 'shared/api'

export const PLAYLISTS_PAGE_SIZE = 20

/**
 * Одна страница плейлистов; `hasMore` вызывающий считает по размеру страницы.
 * @param query - Поисковый запрос по названию/описанию.
 * @param sort - Вариант сортировки.
 * @param order - Направление сортировки.
 * @param page - Номер страницы (с 1).
 */
export const fetchPlaylistsPage = async (
  query: string,
  sort: APITypes.PlaylistControllerFindAllSort,
  order: APITypes.PlaylistControllerFindAllOrder,
  page: number,
): Promise<APITypes.AllPlaylistsResponse> =>
  playlistsApi.getPlaylists().playlistControllerFindAll({
    limit: PLAYLISTS_PAGE_SIZE,
    order,
    page,
    search: query || undefined,
    sort,
  })
