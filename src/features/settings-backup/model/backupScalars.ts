import z from 'zod'
import { importSettingsSchema } from 'features/sermon-audio-import/@x/settings-backup'
import {
  balanceSchema,
  equalizerGainsSchema,
  pitchSchema,
  playbackRateSchema,
  repeatModeSchema,
} from 'entities/player'

/** Маркер и версия формата резервной копии — недоверенный ввод проверяется по ним. */
export const BACKUP_KIND = 'slovo-propovedi-backup'
export const BACKUP_VERSION = 1

export const AUTO_BACKUP_FILE_NAME = 'slovo-backup-auto.json'
export const MANUAL_BACKUP_PREFIX = 'slovo-backup-'
export const MANUAL_BACKUP_EXTENSION = '.json'

/** Паттерн допустимого http(s)-адреса (единый источник для схем и чтения). */
export const HTTP_URL_PATTERN = /^https?:\/\/.+/

/** Режим темы: значения совпадают с `ThemeMode` из `shared/ui/theme`. */
export const themeModeBackupSchema = z.enum(['system', 'light', 'dark'])

/** Настройки приложения, участвующие в резервной копии (все поля опциональны). */
export const settingsBackupSchema = z.object({
  dynamicColors: z.boolean().optional(),
  hapticsEnabled: z.boolean().optional(),
  sermonCachingEnabled: z.boolean().optional(),
  serverUrl: z.string().regex(HTTP_URL_PATTERN).optional(),
  themeMode: themeModeBackupSchema.optional(),
})

/** Настройки звука плеера (проверяются теми же схемами, что и при восстановлении). */
export const playerBackupSchema = z.object({
  balance: balanceSchema.optional(),
  equalizerEnabled: z.boolean().optional(),
  equalizerGains: equalizerGainsSchema.optional(),
  pitch: pitchSchema.optional(),
  playbackRate: playbackRateSchema.optional(),
  repeatMode: repeatModeSchema.optional(),
})

/**
 * Опциональные поля настроек импорта аудио в резервной копии.
 *
 * Схема не дублируется: берётся владельческая `importSettingsSchema`
 * (features/sermon-audio-import) и ослабляется до partial — в файле поле может
 * отсутствовать, а дефолты применяются только на стороне владельца.
 */
export const youtubeImportBackupSchema = importSettingsSchema.partial()
