import { type APITypes, playlistsApi } from 'shared/api'
import { type AdminPlaylistsListItem, toPlaylistListItem } from './playlistListItem'

export const PLAYLISTS_PAGE_SIZE = 20

/**
 * Одна страница плейлистов; `hasMore` вызывающий считает по размеру страницы.
 * Пустой (в том числе пробельный) поиск не отправляется: сервер требует минимум 1
 * символ и отверг бы пустую строку.
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
): Promise<{ count: number; playlists: AdminPlaylistsListItem[] }> => {
  const response = await playlistsApi.getPlaylists().playlistControllerFindAll({
    limit: PLAYLISTS_PAGE_SIZE,
    order,
    page,
    search: query.trim() || undefined,
    sort,
  })

  return { count: response.count, playlists: response.playlists.map(toPlaylistListItem) }
}
