import z from 'zod'
import { listeningHistorySchema } from 'entities/listening-history'
import { myPlaylistsArraySchema, sectionSettingsDraftSchema } from 'entities/playlist'
import {
  BACKUP_KIND,
  BACKUP_VERSION,
  playerBackupSchema,
  settingsBackupSchema,
  youtubeImportBackupSchema,
} from './backupScalars'

/**
 * Полезная нагрузка резервной копии.
 *
 * Каждая секция опциональна: файл мог быть создан более старой/новой версией
 * приложения, а часть данных могла отсутствовать на момент экспорта. Все поля —
 * недоверенный ввод, поэтому валидируются этой схемой перед применением.
 */
const backupDataSchema = z.object({
  listeningHistory: listeningHistorySchema.optional(),
  myPlaylists: myPlaylistsArraySchema.optional(),
  myPlaylistsSectionSettings: sectionSettingsDraftSchema.optional(),
  player: playerBackupSchema.optional(),
  settings: settingsBackupSchema.optional(),
  youtubeImport: youtubeImportBackupSchema.optional(),
})

/** Формат файла резервной копии целиком (маркер + версия + данные). */
export const backupFileSchema = z.object({
  data: backupDataSchema,
  exportedAt: z.string(),
  kind: z.literal(BACKUP_KIND),
  version: z.literal(BACKUP_VERSION),
})

export type BackupFile = z.infer<typeof backupFileSchema>
export type BackupImportData = z.infer<typeof backupDataSchema>
export type BackupImportMode = 'merge' | 'replace'
