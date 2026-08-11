import { type SermonData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapPlaylistSermonPlaylistsItemToPlaylistData } from './mapPlaylistSermonPlaylistsItemToPlaylistData'

/**
 * Маппер: PlaylistSermon (API) -> SermonData (App).
 * Проповедь внутри плейлиста: playlists содержит только лёгкие ссылки на плейлисты.
 * @param apiSermon - Проповедь из плейлиста в API.
 */
export const mapPlaylistSermonToSermonData = (apiSermon: APITypes.PlaylistSermon): SermonData => ({
  artist: apiSermon.artist,
  artwork: apiSermon.artwork,
  audioUrl: apiSermon.audioUrl ?? null,
  chapter: apiSermon.chapter,
  description: apiSermon.description,
  id: apiSermon.id,
  playlists: apiSermon.playlists?.map(mapPlaylistSermonPlaylistsItemToPlaylistData),
  textFileUrl: apiSermon.textFileUrl ?? null,
  title: apiSermon.title,
  verse: undefined,
  youtubeUrl: apiSermon.youtubeUrl ?? null,
})
