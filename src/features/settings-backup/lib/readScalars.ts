import AsyncStorage from '@react-native-async-storage/async-storage'
import { readImportSettings } from 'features/sermon-audio-import/@x/settings-backup'
import {
  balanceSchema,
  equalizerGainsSchema,
  pitchSchema,
  playbackRateSchema,
  repeatModeSchema,
} from 'entities/player'
import {
  CURRENT_EQUALIZER_ENABLED,
  CURRENT_EQUALIZER_GAINS,
  CURRENT_PLAYBACK_RATE,
  CURRENT_REPEAT_MODE,
  CURRENT_SOUND_BALANCE,
  CURRENT_SOUND_PITCH,
} from 'shared/config'
import type z from 'zod'
import { type BackupImportData } from '../model/backupPayload'
import { HTTP_URL_PATTERN, themeModeBackupSchema } from '../model/backupScalars'

// Ключи, объявленные локальными константами у владельцев (theme/settings/
// offline-cache), читаются той же строкой. Владельцы: shared/ui/theme/model.ts,
// shared/model/settings.ts, entities/offline-cache/lib/sermonCachingSetting.ts.
const THEME_MODE_KEY = 'theme_mode'
const DYNAMIC_COLORS_KEY = 'dynamic_colors'
const HAPTICS_ENABLED_KEY = 'haptics_enabled'
const SERVER_URL_KEY = 'server-url'
const SERMON_CACHING_ENABLED_KEY = 'sermon_caching_enabled'

const readString = async <T>(key: string, schema: z.ZodType<T>): Promise<T | undefined> => {
  const raw = await AsyncStorage.getItem(key)
  if (raw === null) return undefined
  const parsed = schema.safeParse(raw)
  return parsed.success ? parsed.data : undefined
}

const readNumber = async <T>(key: string, schema: z.ZodType<T>): Promise<T | undefined> => {
  const raw = await AsyncStorage.getItem(key)
  if (raw === null) return undefined
  const parsed = schema.safeParse(Number(raw))
  return parsed.success ? parsed.data : undefined
}

const readBoolean = async (key: string): Promise<boolean | undefined> => {
  const raw = await AsyncStorage.getItem(key)
  if (raw === null) return undefined
  return raw === 'true'
}

const readJson = async <T>(key: string, schema: z.ZodType<T>): Promise<T | undefined> => {
  const raw = await AsyncStorage.getItem(key)
  if (raw === null) return undefined
  try {
    const value: unknown = JSON.parse(raw)
    const parsed = schema.safeParse(value)
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

const readHttpUrl = async (key: string): Promise<string | undefined> => {
  const raw = await AsyncStorage.getItem(key)
  if (raw === null || !HTTP_URL_PATTERN.test(raw)) return undefined
  return raw
}

const readSettingsScalars = async (): Promise<BackupImportData['settings']> => {
  const [dynamicColors, hapticsEnabled, sermonCachingEnabled, serverUrl, themeMode] =
    await Promise.all([
      readBoolean(DYNAMIC_COLORS_KEY),
      readBoolean(HAPTICS_ENABLED_KEY),
      readBoolean(SERMON_CACHING_ENABLED_KEY),
      readHttpUrl(SERVER_URL_KEY),
      readString(THEME_MODE_KEY, themeModeBackupSchema),
    ])

  return { dynamicColors, hapticsEnabled, sermonCachingEnabled, serverUrl, themeMode }
}

const readPlayerScalars = async (): Promise<BackupImportData['player']> => {
  const [balance, equalizerEnabled, equalizerGains, pitch, playbackRate, repeatMode] =
    await Promise.all([
      readNumber(CURRENT_SOUND_BALANCE, balanceSchema),
      readBoolean(CURRENT_EQUALIZER_ENABLED),
      readJson(CURRENT_EQUALIZER_GAINS, equalizerGainsSchema),
      readNumber(CURRENT_SOUND_PITCH, pitchSchema),
      readNumber(CURRENT_PLAYBACK_RATE, playbackRateSchema),
      readString(CURRENT_REPEAT_MODE, repeatModeSchema),
    ])

  return { balance, equalizerEnabled, equalizerGains, pitch, playbackRate, repeatMode }
}

const readYouTubeImport = async (): Promise<BackupImportData['youtubeImport']> =>
  readImportSettings()

/** Читает скалярные настройки (приложение, плеер, импорт аудио) из AsyncStorage. */
export const readScalars = async (): Promise<{
  player: BackupImportData['player']
  settings: BackupImportData['settings']
  youtubeImport: BackupImportData['youtubeImport']
}> => {
  const [settings, player, youtubeImport] = await Promise.all([
    readSettingsScalars(),
    readPlayerScalars(),
    readYouTubeImport(),
  ])

  return { player, settings, youtubeImport }
}
