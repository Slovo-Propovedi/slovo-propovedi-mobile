import { type SermonShape } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapPlaylistSermonPlaylistsItemToPlaylistData } from './mapPlaylistSermonPlaylistsItemToPlaylistData'

/**
 * Маппер: PlaylistSermon (API) -> SermonShape (структурная граница shared).
 * Проповедь внутри плейлиста: playlists содержит только лёгкие ссылки на плейлисты.
 * Канонический доменный `SermonData` живёт в entities/sermon; здесь — только
 * структурная форма, чтобы shared не импортировал entities.
 * @param apiSermon - Проповедь из плейлиста в API.
 */
export const mapPlaylistSermonToSermonShape = (
  apiSermon: APITypes.PlaylistSermon,
): SermonShape => ({
  artist: apiSermon.artist,
  artwork: apiSermon.artwork,
  audioUrl: apiSermon.audioUrl ?? null,
  book: apiSermon.book,
  chapter: apiSermon.chapter,
  description: apiSermon.description,
  id: apiSermon.id,
  playlists: apiSermon.playlists?.map(mapPlaylistSermonPlaylistsItemToPlaylistData),
  textFileUrl: apiSermon.textFileUrl ?? null,
  title: apiSermon.title,
  verse: apiSermon.verse,
  youtubeUrl: apiSermon.youtubeUrl ?? null,
})
