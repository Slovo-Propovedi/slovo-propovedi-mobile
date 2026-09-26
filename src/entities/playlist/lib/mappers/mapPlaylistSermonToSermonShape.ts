import { type APITypes } from 'shared/api'
import { type SermonShape } from 'shared/model'
import { mapPlaylistSermonPlaylistsItemToPlaylistData } from './mapPlaylistSermonPlaylistsItemToPlaylistData'

/**
 * Маппер: PlaylistSermon (API) -> SermonShape (структурная граница домена).
 * Проповедь внутри плейлиста: playlists содержит только лёгкие ссылки на плейлисты.
 * Канонический доменный `SermonData` живёт в entities/sermon; здесь — структурная
 * форма, чтобы playlist/section не тянули сущность проповеди.
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
