import { mapPlaylistEntityToPlaylistData } from 'entities/playlist/@x/sermon'
import { type APITypes } from 'shared/api'
import { nullIfEmpty } from 'shared/lib/utils/nullIfEmpty'
import { type SermonData } from '../../model/sermon'

/**
 * Маппер: SermonEntity (API) -> SermonData (App).
 * @param apiSermon - Проповедь из API.
 */
export const mapSermonEntityToSermonData = (apiSermon: APITypes.SermonEntity): SermonData => ({
  artist: apiSermon.artist,
  artwork: nullIfEmpty(apiSermon.artwork),
  audioUrl: apiSermon.audioUrl ?? null,
  book: apiSermon.book,
  chapter: apiSermon.chapter,
  description: apiSermon.description ?? undefined,
  id: apiSermon.id,
  playlists: apiSermon.playlists?.map(mapPlaylistEntityToPlaylistData),
  textFileUrl: apiSermon.textFileUrl ?? null,
  title: apiSermon.title,
  verse: apiSermon.verse,
  youtubeUrl: apiSermon.youtubeUrl ?? null,
})
