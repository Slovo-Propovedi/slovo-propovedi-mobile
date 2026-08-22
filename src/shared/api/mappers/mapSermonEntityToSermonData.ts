import { type SermonData } from '../../model/domain/common'
import { type APITypes } from '../generated'
import { mapPlaylistEntityToPlaylistData } from './mapPlaylistEntityToPlaylistData'

/**
 * Маппер: SermonEntity (API) -> SermonData (App).
 * @param apiSermon - Проповедь из API.
 */
export const mapSermonEntityToSermonData = (apiSermon: APITypes.SermonEntity): SermonData => ({
  artist: apiSermon.artist,
  artwork: apiSermon.artwork ?? null,
  audioUrl: apiSermon.audioUrl ?? null,
  book: apiSermon.book,
  chapter: apiSermon.chapter,
  description: apiSermon.description,
  id: apiSermon.id,
  playlists: apiSermon.playlists?.map(mapPlaylistEntityToPlaylistData),
  textFileUrl: apiSermon.textFileUrl ?? null,
  title: apiSermon.title,
  verse: apiSermon.verse,
  youtubeUrl: apiSermon.youtubeUrl ?? null,
})
