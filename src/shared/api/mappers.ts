import { type PlaylistData, type SermonData } from '../model/domain/common'
import { type APITypes } from './generated'

/**
 * Маппер: SermonEntity (API) -> SermonData (App).
 * @param apiSermon - Проповедь из API.
 */
export const mapSermonEntityToSermonData = (apiSermon: APITypes.SermonEntity): SermonData => ({
  artist: apiSermon.artist,
  artwork: apiSermon.artwork,
  audioUrl: apiSermon.audioUrl ?? null,
  chapter: apiSermon.chapter,
  description: apiSermon.description,
  id: apiSermon.id,
  playlists: apiSermon.playlists?.map(mapPlaylistEntityToPlaylistData),
  textFileUrl: apiSermon.textFileUrl ?? null,
  title: apiSermon.title,
  verse: undefined,
  youtubeUrl: apiSermon.youtubeUrl ?? null,
})

/**
 * Маппер: PlaylistEntity (API) -> PlaylistData (App).
 *
 * Конвертирует `sermons` из API в локальный формат.
 * @param apiPlaylist - Плейлист из API.
 */
export const mapPlaylistEntityToPlaylistData = (
  apiPlaylist: APITypes.PlaylistEntity,
): PlaylistData => ({
  artwork: apiPlaylist.artwork,
  description: apiPlaylist.description,
  id: apiPlaylist.id,
  sections: apiPlaylist.sections,
  sermons: apiPlaylist.sermons.map(mapSermonEntityToSermonData),
  title: apiPlaylist.title,
})

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

/**
 * Маппер ответа API: AllSectionsResponse -> SectionEntity[].
 * @param response - Ответ API с секциями.
 */
export const mapAllSectionsResponse = (
  response: APITypes.AllSectionsResponse,
): APITypes.SectionEntity[] => response.sections ?? []
