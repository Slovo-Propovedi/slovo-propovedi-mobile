import type { APITypes } from 'shared/api/generated'
import type { PlaylistData, SermonData } from 'shared/model'

/**
 * Маппер: SermonEntity (API) -> SermonData (App).
 *
 * Добавляет локальные поля, которые не приходят с бэкенда:
 * - artist: автор/церковь (заглушка)
 * - artwork: URL обложки (заглушка).
 * @param apiSermon - Проповедь из API.
 */
export const mapSermonEntityToSermonData = (apiSermon: APITypes.SermonEntity): SermonData => {
  if (!apiSermon.id || !apiSermon.title) throw new Error('SermonEntity must have id and title')

  return {
    // Заглушки для обязательных полей
    artist: 'Slovo Propovedi',
    artwork: '',
    audioUrl: apiSermon.audioUrl ?? '',
    description: apiSermon.description ?? '',
    id: apiSermon.id,
    playlists: apiSermon.playlists?.map(mapPlaylistEntityToPlaylistData) ?? [],
    textFileUrl: apiSermon.textFileUrl ?? '',
    title: apiSermon.title,
    youtubeUrl: apiSermon.youtubeUrl ?? '',
  }
}

/**
 * Маппер: PlaylistEntity (API) -> PlaylistData (App).
 *
 * Конвертирует `sermons` из API в локальный формат.
 * Добавляет заглушку для artwork.
 * @param apiPlaylist - Плейлист из API.
 */
export const mapPlaylistEntityToPlaylistData = (
  apiPlaylist: APITypes.PlaylistEntity,
): PlaylistData => {
  if (!apiPlaylist.id || !apiPlaylist.title)
    throw new Error('PlaylistEntity must have id and title')

  if (!apiPlaylist.sermons) throw new Error('PlaylistEntity must have sermons')

  const sermons = apiPlaylist.sermons.map(mapSermonEntityToSermonData)

  return {
    // Заглушка для обязательного поля
    artwork: '',
    description: apiPlaylist.description ?? '',
    id: apiPlaylist.id,
    sections: apiPlaylist.sections ?? [],
    sermons,
    title: apiPlaylist.title,
  }
}

/**
 * Маппер массива: SermonEntity[] -> SermonData[].
 * @param apiSermons - Массив проповедей из API.
 */
export const mapSermonEntities = (apiSermons: APITypes.SermonEntity[]): SermonData[] =>
  apiSermons.map(mapSermonEntityToSermonData)

/**
 * Маппер массива: PlaylistEntity[] -> PlaylistData[].
 * @param apiPlaylists - Массив плейлистов из API.
 */
export const mapPlaylistEntities = (apiPlaylists: APITypes.PlaylistEntity[]): PlaylistData[] =>
  apiPlaylists.map(mapPlaylistEntityToPlaylistData)

/**
 * Маппер ответа API: AllSermonsResponse -> SermonData[].
 * @param response - Ответ API с проповедями.
 */
export const mapAllSermonsResponse = (response: APITypes.AllSermonsResponse): SermonData[] =>
  mapSermonEntities(response.sermons ?? [])

/**
 * Маппер ответа API: AllPlaylistsResponse -> PlaylistData[].
 * @param response - Ответ API с плейлистами.
 */
export const mapAllPlaylistsResponse = (response: APITypes.AllPlaylistsResponse): PlaylistData[] =>
  mapPlaylistEntities(response.playlists ?? [])
