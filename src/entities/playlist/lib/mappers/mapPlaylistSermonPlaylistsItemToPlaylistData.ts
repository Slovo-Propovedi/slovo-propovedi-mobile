import { type APITypes } from 'shared/api'
import { type PlaylistData } from '../../model'

/**
 * Маппер: PlaylistSermonPlaylistsItem (API) -> PlaylistData (App).
 * Плейлисты внутри PlaylistSermon приходят в виде лёгких ссылок (только id и title),
 * поэтому недостающие поля заполняются значениями по умолчанию.
 * @param item - Ссылка на плейлист из API.
 */
export const mapPlaylistSermonPlaylistsItemToPlaylistData = (
  item: APITypes.PlaylistSermonPlaylistsItem,
): PlaylistData => ({
  artwork: null,
  description: undefined,
  id: item.id,
  sections: undefined,
  sermons: [],
  title: item.title,
})
