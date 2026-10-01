import { setCachedJson } from 'shared/lib/cache'
import { type LocalPlaylistData, MY_PLAYLISTS } from './localPlaylists'

/**
 * Единственный путь записи массива локальных плейлистов в AsyncStorage.
 *
 * Используется гидратацией, reorder и переключением принадлежности проповеди.
 * Отказ записи обрабатывает вызывающий (та же политика деградации: логирование
 * + коммит атома).
 * @param playlists - Массив плейлистов в желаемом виде.
 */
export const persistMyPlaylists = (playlists: LocalPlaylistData[]) =>
  setCachedJson(MY_PLAYLISTS, playlists)
