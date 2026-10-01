import { setCachedJson } from 'shared/lib/cache'
import { type LocalSectionSettings, MY_PLAYLISTS_SECTION_SETTINGS } from './localSectionSettings'

/**
 * Единственный путь записи настроек оформления секции «Мои плейлисты».
 *
 * Отказ записи обрабатывает вызывающий (политика деградации: логирование +
 * коммит атома — как у `persistMyPlaylists`).
 * @param settings - Настройки в желаемом виде.
 */
export const persistSectionSettings = (settings: LocalSectionSettings) =>
  setCachedJson(MY_PLAYLISTS_SECTION_SETTINGS, settings)
