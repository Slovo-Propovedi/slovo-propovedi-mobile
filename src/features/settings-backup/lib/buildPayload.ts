import { readHistory } from 'entities/listening-history'
import { readStoredMyPlaylists, readStoredSectionSettings } from 'entities/playlist'
import { type BackupFile } from '../model/backupPayload'
import { BACKUP_KIND, BACKUP_VERSION } from '../model/backupScalars'
import { readScalars } from './readScalars'

// Секция скаляров без единого определённого поля не попадает в файл: пустой
// объект только засорял бы бэкап и не несёт данных.
const dropEmpty = <T extends object>(value: T): T | undefined =>
  Object.values(value).some(field => field !== undefined) ? value : undefined

/**
 * Собирает снимок текущего состояния приложения для записи в файл.
 *
 * Читает владельческие пути (история, локальные плейлисты, настройки секции) и
 * напрямую — скаляры из AsyncStorage. Отсутствующая/невалидная секция просто
 * опускается, а не роняет экспорт.
 */
export const buildPayload = async (): Promise<BackupFile> => {
  const [listeningHistory, myPlaylists, myPlaylistsSectionSettings, scalars] = await Promise.all([
    readHistory(),
    readStoredMyPlaylists(),
    readStoredSectionSettings(),
    readScalars(),
  ])

  return {
    data: {
      listeningHistory,
      myPlaylists,
      myPlaylistsSectionSettings,
      player: scalars.player ? dropEmpty(scalars.player) : undefined,
      settings: scalars.settings ? dropEmpty(scalars.settings) : undefined,
      youtubeImport: scalars.youtubeImport ? dropEmpty(scalars.youtubeImport) : undefined,
    },
    exportedAt: new Date().toISOString(),
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
  }
}
